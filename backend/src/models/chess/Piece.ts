import { checkDiagonals, checkHorizontalDir, checkVerticalDir } from "../../utils/chess/checkMoves"
import checkPos from "../../utils/chess/checkPos"
import posInList from "../../utils/chess/posInList"
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

    let posToCheck : Pos = {x: this.pos.x, y:this.pos.y+this.moveDir}
    if (checkPos(posToCheck, game) === -1) {
      legalMoves.push(posToCheck)

      posToCheck = {x: posToCheck.x, y: posToCheck.y}
      posToCheck.y += this.moveDir
      if (checkPos(posToCheck, game) === -1 && this.firstMove) {
        legalMoves.push(posToCheck)
      }
    }

    posToCheck = {x: this.pos.x-1, y: this.pos.y+this.moveDir}
    let i = checkPos(posToCheck, game)
    if (i !== -1 && game.pieces[i].white !== this.white) {
      legalMoves.push(posToCheck)
    }

    posToCheck = {x: this.pos.x+1, y: this.pos.y+this.moveDir}
    i = checkPos(posToCheck, game)
    if (i !== -1 && game.pieces[i].white !== this.white) {
      legalMoves.push(posToCheck)
    }

    if (this.white && this.pos.y === 3) {
      this.validateEnPassant(game, legalMoves)
    } else if (!this.white && this.pos.y === 4) {
      this.validateEnPassant(game, legalMoves)
    }

    return legalMoves
  }

  validateEnPassant(game : Game, legalMoves : Pos[]) {
    let posToCheck : Pos = {x: this.pos.x+1, y: this.pos.y}
    if (this.checkEnPassant(posToCheck, game)) {
      posToCheck.specialMove = "enpassant"
      posToCheck.y+=this.moveDir
      legalMoves.push(posToCheck)
    }
    posToCheck = {x: this.pos.x-1, y: this.pos.y}
    if (this.checkEnPassant(posToCheck, game)) {
      posToCheck.specialMove = "enpassant"
      posToCheck.y+=this.moveDir
      legalMoves.push(posToCheck)
    }
  } 

  checkEnPassant(pos: Pos, game: Game) {
    const i = checkPos(pos, game)
    if (i !== -1 && game.pieces[i].white !== this.white) {
      if (game.previousPos.pieces[i].firstMove) {
        return true
      }
    }
    return false
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
        if (game.pieces[i].white === this.white) {
          return
        }
      }

      for (let a = 0; a < game.pieces.length; a++) {
        if (game.pieces[a].white === this.white) continue
        if (posInList(posToCheck, game.pieces[a].legalMoves)) {
          return
        }
      }

      legalMoves.push(posToCheck)
    })

    if (this.kingSideCastle(game)) {
      const pos : Pos = {x: 6, y: this.pos.y, specialMove:"kingsidecastle"}
      legalMoves.push(pos)
    }

    if (this.queenSideCastle(game)) {
      const pos : Pos = {x: 2, y: this.pos.y, specialMove:"queensidecastle"}
      legalMoves.push(pos)
    }

    return legalMoves
  }

  kingSideCastle(game: Game){
    if (this.firstMove) {
      for (let x = this.pos.x+1; x < 7; x++) {
        if (checkPos({x: x, y: this.pos.y}, game) !== -1) {
          return false
        }
        for (let i = 0; i < game.pieces.length; i++) {
          if (game.pieces[i].white === this.white) continue

          if (posInList({x: x, y: this.pos.y}, game.pieces[i].legalMoves)) {
            return false
          } 
        }
      }

      const i = checkPos({x: 7, y: this.pos.y}, game)
      if (i !== -1 && game.pieces[i].firstMove) {
        return true
      }
    }

    return false
  }

  queenSideCastle(game: Game) {
    if (this.firstMove) {
      for (let x = this.pos.x-1; x > 0; x--) {
        if (checkPos({x: x, y: this.pos.y}, game) !== -1) {
          return false
        }
        for (let i = 0; i < game.pieces.length; i++) {
          if (game.pieces[i].white === this.white) continue

          if (posInList({x: x, y: this.pos.y}, game.pieces[i].legalMoves)) {
            return false
          } 
        }
      }
      const i = checkPos({x: 0, y: this.pos.y}, game)
      if (i !== -1 && game.pieces[i].firstMove) {
        return true
      }
    }
    return false
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
