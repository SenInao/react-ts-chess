import { clone } from "lodash";
import { Packet } from "../../server";
import checkPos from "../../utils/chess/checkPos";
import Piece, { Bishop, King, Knight, Pawn, Pos, Queen, Rook } from "./Piece";
import Player from "./Player";
import cloneDeep from "lodash/cloneDeep"

interface Move {
  oldPos : Pos
  newPos : Pos
}

export default class Game {
  player1: Player
  player2: Player
  pieces: Piece[]

  constructor(player1: Player, player2: Player) {
    this.player1 = player1
    this.player2 = player2

    player1.inGame = true
    player2.inGame = true

    this.pieces = []
    this.createPieces()
    this.updateLegalMoves(this)

    this.broadcastGamestate()
  }

  broadcastGamestate() {
    const payload = JSON.parse(JSON.stringify(this))
    delete payload.player1.ws
    delete payload.player2.ws

    const packet: Packet = {
      id: -1,
      action: "chess-gameState",
      payload: payload
    }

    this.player1.ws.send(JSON.stringify(packet))
    this.player2.ws.send(JSON.stringify(packet))
  }

  checkCheck(pieces: Piece[], king: Piece) {
    for (let i = 0; i < pieces.length; i++) {
      for (let b = 0; b < pieces[i].legalMoves.length; b++) {
        if  (pieces[i].legalMoves[b].x === king.pos.x && pieces[i].legalMoves[b].y === king.pos.y) {
          return true
        }
      }
    }
    return false
  }

  updateLegalMoves(game: Game) {
    game.pieces.forEach(piece => {
      piece.legalMoves = piece.findAllowedMoves(this);
    });
  }

  updatePosition(piece: Piece, pos: Pos, game: Game) {
    const i = checkPos(pos, this)
    if (i !== -1) {
      game.pieces.splice(i, 1)
    }

    piece.pos = pos
  }

  simulateMove(move: Move, game: Game, id: number) {
    var player : any
    if (id === game.player1.id) {
      player = game.player2
    } else {
      player = game.player1
    }

    const i = checkPos(move.oldPos, this)
    if (i === -1) {
      return
    }

    this.updatePosition(game.pieces[i], move.newPos, game)

    game.updateLegalMoves(game)
    return game.checkCheck(game.pieces, player.king);
  }

  validateChessMove(id: number, move: Move) {
    var player : any
    if (id === this.player1.id) {
      player = this.player2
    } else {
      player = this.player1
    }

    const i = checkPos(move.oldPos, this)
    if (i === -1) {
      console.log("invalid")
      return
    }

    this.pieces[i].legalMoves.forEach(legalMove => {
      if (legalMove.x === move.newPos.x && legalMove.y === move.newPos.y) {
        console.log("valid move")
        this.updatePosition(this.pieces[i], move.newPos, this)

        this.player1.turn = !this.player1.turn
        this.player2.turn = !this.player2.turn

        this.updateLegalMoves(this)
        player.inCheck = this.checkCheck(this.pieces, player.king)
        if (player.inCheck) {
          this.pieces.forEach(piece => {
            if (piece.white !== player.white) return
            const newLegalMoves : Pos[] = []
            piece.legalMoves.forEach(pos => {
              const game = cloneDeep(this)
              const move = {
                oldPos : piece.pos,
                newPos : pos
              }
              if (!this.simulateMove(move, game, id)) {
                newLegalMoves.push(pos)
              }
              piece.legalMoves = newLegalMoves
            })
          })
        }
      }
    })
  }

  createPieces() {
    for (let x = 0; x < 8; x++) {
      this.pieces.push(new Pawn(x, 6, true)) 
    }

    for (let x = 0; x < 8; x++) {
      this.pieces.push(new Pawn(x, 1, false))
    }

    const blackKing = new King(4,0, false)
    const whiteKing = new King(4,7, true)
    this.pieces.push(whiteKing)
    this.pieces.push(blackKing)

    this.pieces.push(new Queen(3,0,false))
    this.pieces.push(new Queen(3,7,true))

    this.pieces.push(new Bishop(2, 0, false))
    this.pieces.push(new Bishop(5, 0, false))
    this.pieces.push(new Bishop(2, 7, true))
    this.pieces.push(new Bishop(5, 7, true))

    this.pieces.push(new Knight(1, 0, false))
    this.pieces.push(new Knight(6, 0, false))
    this.pieces.push(new Knight(1, 7, true))
    this.pieces.push(new Knight(6, 7, true))

    this.pieces.push(new Rook(0, 0, false))
    this.pieces.push(new Rook(7, 0, false))
    this.pieces.push(new Rook(0, 7, true))
    this.pieces.push(new Rook(7, 7, true))

    if (this.player1.white) {
      this.player1.king = whiteKing
      this.player2.king = blackKing
    } else {
      this.player1.king = blackKing 
      this.player2.king = whiteKing
    }
  }
}
