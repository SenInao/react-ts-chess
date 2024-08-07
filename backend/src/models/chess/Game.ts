import { Packet } from "../../server";
import checkPos from "../../utils/chess/checkPos";
import posInList from "../../utils/chess/posInList";
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
  winner: number
  previousPos : Game

  constructor(player1: Player, player2: Player) {
    this.player1 = player1
    this.player2 = player2
    this.winner = 0

    player1.inGame = true
    player2.inGame = true

    this.previousPos = cloneDeep(this)

    this.pieces = []
    this.createPieces()
    this.updateLegalMoves()

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
      if(posInList(king.pos, pieces[i].legalMoves)) {
        return true
      }
    }
    return false
  }

  updateLegalMoves() {
    this.pieces.forEach(piece => {
      piece.legalMoves = piece.findAllowedMoves(this);
    });
  }

  updatePosition(piece: Piece, pos: Pos) {
    let i = checkPos(pos, this)
    if (i !== -1) {
      this.pieces.splice(i, 1)
    } else if (pos.specialMove === "enpassant") {
      pos.y -= piece.moveDir
      i = checkPos(pos, this)
      this.pieces.splice(i, 1)
      pos.y += piece.moveDir
    } else if (pos.specialMove === "kingsidecastle") {
      i = checkPos({x:7, y:piece.pos.y}, this)
      this.pieces[i].pos.x = 5
    } else if (pos.specialMove === "queensidecastle") {
      i = checkPos({x:0, y:piece.pos.y}, this)
      this.pieces[i].pos.x = 3
    }

    piece.firstMove = false
    piece.pos = pos
  }

  simulateMove(move: Move, game: Game, player: any) {
    const i = checkPos(move.oldPos, this)
    if (i === -1) {
      return
    }

    game.updatePosition(game.pieces[i], move.newPos)

    game.updateLegalMoves()
    return game.checkCheck(game.pieces, player.king);
  }

  checkMate(player: any) {
    let checkMate = true
    this.pieces.forEach(piece => {
      if (piece.white !== player.white) return
      const newLegalMoves : Pos[] = []
      piece.legalMoves.forEach(pos => {
        const game = cloneDeep(this)
        const move = {
          oldPos : piece.pos,
          newPos : pos
        }
        if (!this.simulateMove(move, game, player)) {
          newLegalMoves.push(pos)
          checkMate = false
        }
        piece.legalMoves = newLegalMoves
      })
    })

    return checkMate
  }

  checkDraw(player: Player) {
    let draw = true
    this.pieces.forEach(piece => {
      if (piece.white !== player.white) return
      if (piece.legalMoves.length > 0) {
        draw = false
      }
    })

    return draw
  }

  validateChessMove(id: number, move: Move) {
    var player : any
    var oppositePlayer : any
    if (id === this.player1.id) {
      oppositePlayer = this.player2
      player = this.player1
    } else {
      oppositePlayer = this.player1
      player = this.player2
    }

    const i = checkPos(move.oldPos, this)
    if (i === -1) {
      console.log("invalid")
      return
    }

    this.pieces[i].legalMoves.forEach(legalMove => {
      if (legalMove.x === move.newPos.x && legalMove.y === move.newPos.y) {
        this.previousPos = cloneDeep(this)

        this.updatePosition(this.pieces[i], legalMove)

        this.player1.turn = !this.player1.turn
        this.player2.turn = !this.player2.turn

        this.updateLegalMoves()
        oppositePlayer.inCheck = this.checkCheck(this.pieces, oppositePlayer.king)

        if (oppositePlayer.inCheck) {
          if (this.checkMate(oppositePlayer)) {
            this.winner = player.id
          }
        } else {
          if (this.checkDraw(oppositePlayer)) {
            this.winner = -1
          }
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

    const blackKing = new King(4,0, false)
    const whiteKing = new King(4,7, true)
    this.pieces.push(whiteKing)
    this.pieces.push(blackKing)

    if (this.player1.white) {
      this.player1.king = whiteKing
      this.player2.king = blackKing
    } else {
      this.player1.king = blackKing 
      this.player2.king = whiteKing
    }
  }
}
