import { checkDiagonals, checkHorizontalDir, checkVerticalDir, outOfBounds } from "../../utils/chess/checkMoves"
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
    if (!outOfBounds(posToCheck) && !game.board[posToCheck.y][posToCheck.x]) {
      if (posToCheck.y === 0 || posToCheck.y === 7) {
        posToCheck.specialMove = "promotion"
      }
      legalMoves.push(posToCheck)

      posToCheck = {x: posToCheck.x, y: posToCheck.y}
      posToCheck.y += this.moveDir
      if (this.firstMove && !game.board[posToCheck.y][posToCheck.x]) {
        legalMoves.push(posToCheck)
      }
    }

    posToCheck = {x: this.pos.x-1, y: this.pos.y+this.moveDir}
    if (!outOfBounds(posToCheck)) {
      var piece = game.board[posToCheck.y][posToCheck.x]
      if (piece && piece.white !== this.white) {
        if (posToCheck.y === 0 || posToCheck.y === 7) {
          posToCheck.specialMove = "promotion"
        }
        legalMoves.push(posToCheck)
      }
    }

    posToCheck = {x: this.pos.x+1, y: this.pos.y+this.moveDir}
    if (!outOfBounds(posToCheck)) {
      var piece = game.board[posToCheck.y][posToCheck.x]
      if (piece && piece.white !== this.white) {
        if (posToCheck.y === 0 || posToCheck.y === 7) {
          posToCheck.specialMove = "promotion"
        }
        legalMoves.push(posToCheck)
      }
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
    if (!outOfBounds(posToCheck) && this.checkEnPassant(posToCheck, game)) {
      posToCheck.specialMove = "enpassant"
      posToCheck.y+=this.moveDir
      legalMoves.push(posToCheck)
    }

    posToCheck = {x: this.pos.x-1, y: this.pos.y}
    if (!outOfBounds(posToCheck) && this.checkEnPassant(posToCheck, game)) {
      posToCheck.specialMove = "enpassant"
      posToCheck.y+=this.moveDir
      legalMoves.push(posToCheck)
    }
  } 

  checkEnPassant(pos: Pos, game: Game) {
    const piece = game.board[pos.y][pos.x]
    if (piece && piece.white !== this.white) {
      const lastPos = game.previousPos[pos.y+this.moveDir*2][pos.x]
      if (lastPos && lastPos.firstMove) {
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
      const posToCheck : Pos = {x: this.pos.x + move.x, y: this.pos.y + move.y}
      if (outOfBounds(posToCheck)) {
        return
      }

      let piece = game.board[posToCheck.y][posToCheck.x]
      if (piece && piece.white === this.white) {
        return
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
      for (let x = this.pos.x; x < 7; x++) {
        if (game.board[this.pos.y][x] && game.board[this.pos.y][x] !== this) {
          return false
        }
        for (let yPos = 0; yPos < 8; yPos++) {
          for (let xPos = 0; xPos < 8; xPos++) {
            const piece = game.board[yPos][xPos]
            if (!piece) continue
            
            if (piece.white === this.white) continue

            if (posInList({x: x, y: this.pos.y}, piece.legalMoves)) {
              return false
            } 
          }
        }
      }

      const piece = game.board[this.pos.y][7]
      if (piece && piece.firstMove) {
        return true
      }
    }

    return false
  }

  queenSideCastle(game: Game) {
    if (this.firstMove) {
      for (let x = this.pos.x; x > 0; x--) {
        if (game.board[this.pos.y][x] && game.board[this.pos.y][x] !== this) {
          return false
        }

        for (let yPos = 0; yPos < 8; yPos++) {
          for (let xPos = 0; xPos < 8; xPos++) {
            const piece = game.board[yPos][xPos]
            if (!piece) continue
            
            if (piece.white === this.white) continue

            if (posInList({x: x, y: this.pos.y}, piece.legalMoves)) {
              return false
            } 
          }
        }
      }
      const piece = game.board[this.pos.y][0]
      if (piece && piece.firstMove) {
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
      if (outOfBounds(posToCheck)) {
        return
      }
      const piece = game.board[posToCheck.y][posToCheck.x]
      if (piece) {
        if (piece.white !== this.white) {
          legalMoves.push(posToCheck)
        }
      } else {
        legalMoves.push(posToCheck)
      }
    })
    return legalMoves
  }
}
