import { checkDiagonals, checkHorizontalDir, checkVerticalDir } from "../../utils/chess/checkMoves"
import checkPos from "../../utils/chess/checkPos"
import Game from "./Game"

export type Pos = {
  x : number
  y : number
  specialMove? : string
}

export default class Piece {
  pos : Pos
  white : boolean
  legalMoves: Pos[]
  moveDir : number
  firstMove : boolean
  type : string

	constructor(x : number, y : number, white : boolean) {
    this.pos = {x: x, y: y}
		this.legalMoves = [];
    this.white = white
    this.firstMove = true
    this.type = ""
    if (this.white) {
      this.moveDir = -1
    } else {
      this.moveDir = 1
    }
	};

  findAllowedMoves(game: Game) {
    const legalMoves : Pos[] = []
    return legalMoves
  }
};

export class Pawn extends Piece {
  constructor(x: number, y: number, white: boolean) {
    super(x, y, white)
    this.type = "P"
  }

  findAllowedMoves(game: Game) {
    var legalMoves: Pos[] = []
    const moves = [
      {x: 0, y:1},
      {x: 0, y:2},
    ]

    moves.forEach(move => {
      const posToCheck = {x: this.pos.x + move.x*this.moveDir, y: this.pos.y + move.y*this.moveDir}
      if (checkPos(posToCheck, game) === -1 ) {
        legalMoves.push(posToCheck)
      }
    })

    return legalMoves
  }
}

export class King extends Piece {
  constructor(x: number, y: number, white: boolean) {
    super(x, y, white)
    this.type = "K"
  }

  findAllowedMoves(game: Game) {
    var legalMoves: Pos[] = []
    const moves = [
      {x:0, y:1},
      {x:0, y:-1},
      {x:1, y:0},
      {x:-1, y:0},
      {x:-1, y:-1},
      {x:1, y:-1},
      {x:-1, y:1},
      {x:1, y:1},
    ]

    moves.forEach(move => {
      const posToCheck = {x: this.pos.x + move.x, y: this.pos.y + move.y}
      if (posToCheck.x > 7 || posToCheck.x < 0 || posToCheck.y > 7 || posToCheck.y < 0) {
        return
      }
      const i = checkPos(posToCheck, game)
      if (i !== -1) {
        if (game.pieces[i].white !== this.white) {
          legalMoves.push(posToCheck)
        }
      } else {
        legalMoves.push(posToCheck)
      }
    })

    return legalMoves
  }
}

export class Rook extends Piece {
  constructor(x: number, y: number, white: boolean) {
    super(x, y, white)
    this.type = "R"
  }

  findAllowedMoves(game: Game) {
    var legalMoves = []
    const verticalMoves = checkVerticalDir(this, game)
    const horizontalMoves = checkHorizontalDir(this, game)
    legalMoves = [...verticalMoves, ...horizontalMoves]
    return legalMoves
  }
}

export class Bishop extends Piece {
  constructor(x: number, y: number, white: boolean) {
    super(x, y, white)
    this.type = "B"
  }

  findAllowedMoves(game: Game) {
    var legalMoves = []
    const diagonalMoves = checkDiagonals(this, game)
    legalMoves = [...diagonalMoves]
    return legalMoves
  }
}

export class Queen extends Piece {
  constructor(x: number, y: number, white: boolean) {
    super(x, y, white)
    this.type = "Q"
  }

  findAllowedMoves(game: Game) {
    var legalMoves = []
    const verticalMoves = checkVerticalDir(this, game)
    const horizontalMoves = checkHorizontalDir(this, game)
    const diagonalMoves = checkDiagonals(this, game)
    legalMoves = [...verticalMoves, ...horizontalMoves, ...diagonalMoves]
    return legalMoves
  }
}

export class Knight extends Piece {
  constructor(x: number, y: number, white: boolean) {
    super(x, y, white)
    this.type = "Kn"
  }

  findAllowedMoves(game: Game) {
    var legalMoves : Pos[] = []
    const moves = [
      {x:1, y:2},
      {x:-1, y:2},
      {x:-1, y:-2},
      {x:1, y:-2},
      {x:2, y:-1},
      {x:2, y:1},
      {x:-2, y:1},
      {x:-2, y:-1},
    ]

    moves.forEach(move => {
      const posToCheck = {x: this.pos.x + move.x, y: this.pos.y + move.y}
      if (posToCheck.x > 7 || posToCheck.x < 0 || posToCheck.y > 7 || posToCheck.y < 0) {
        return
      }
      const i = checkPos(posToCheck, game)
      if (i !== -1) {
        if (game.pieces[i].white !== this.white) {
          legalMoves.push(posToCheck)
        }
      } else {
        legalMoves.push(posToCheck)
      }
    })
    return legalMoves
  }
}
