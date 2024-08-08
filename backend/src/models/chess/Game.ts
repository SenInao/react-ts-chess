import { Packet } from "../../server";
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
  board: (Piece | null)[][] = Array.from({length: 8}, () => Array(8).fill(null))
  winner: number
  previousPos : (Piece | null)[][] = Array.from({length: 8}, () => Array(8).fill(null))


  constructor(player1: Player, player2: Player) {
    this.player1 = player1
    this.player2 = player2
    this.winner = 0

    player1.inGame = true
    player2.inGame = true

    this.previousPos = cloneDeep(this.board)

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

  updateLegalMoves() {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x]
        if (!piece) continue
        piece.legalMoves = piece.findAllowedMoves(this)
      }
    }
  }

  updatePosition(piece: Piece, pos: Pos) {
    this.board[piece.pos.y][piece.pos.x] = null
    this.board[pos.y][pos.x] = piece
    piece.pos = pos
  }

  doMove(piece: Piece, pos: Pos) {
    let pieceAtPos = this.board[pos.y][pos.x]
    if (pieceAtPos) {
      this.board[pos.y][pos.x] = null

    } else if (pos.specialMove === "enpassant") {
      pos.y -= piece.moveDir
      this.board[pos.y][pos.x] = null
      pos.y += piece.moveDir

    } else if (pos.specialMove === "kingsidecastle") {
      let rook = this.board[pos.y][7]
      if (!rook) return
      this.updatePosition(rook, {x: 5, y: pos.y})

    } else if (pos.specialMove === "queensidecastle") {
      let rook = this.board[pos.y][0]
      if (!rook) return
      this.updatePosition(rook, {x: 3, y: pos.y})
    }

    piece.firstMove = false
    this.updatePosition(piece, pos)
  }

  simulateMove(move: Move, playerid:number) {
    const game = cloneDeep(this)

    var player : Player
    if (game.player1.id === playerid) {
      player = game.player1
    } else {
      player = game.player2
    }

    const piece = game.board[move.oldPos.y][move.oldPos.x]
    if (!piece) return

    game.doMove(piece, move.newPos)
    game.updateLegalMoves()
    const isCheck = game.checkCheck(game.board, player.king); 
    if (!isCheck) {
      piece
    }
    return isCheck
  }

  checkMate(player: Player) {
    let checkMate = true
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x]
        if (!piece) continue
        if (piece.white !== player.white) continue

        const newLegalMoves : Pos[] = []
        piece.legalMoves.forEach(pos => {
          const move = {
            oldPos : piece.pos,
            newPos : pos
          }
          if (!this.simulateMove(move, player.id)) {
            newLegalMoves.push(pos)
            checkMate = false
          }
          piece.legalMoves = newLegalMoves
        })
      }
    }
    return checkMate
  }

  checkCheck(board : (Piece | null)[][], king: Piece) {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = board[y][x]
        if (!piece) continue
        if (piece.white === king.white) continue
        if(posInList(king.pos, piece.legalMoves)) {
          return true
        }
      }
    }
    return false
  }

  checkDraw(player: Player) {
    let draw = true
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.board[y][x]
        if (!piece) continue
        
        if (piece.white !== player.white) return
        if (piece.legalMoves.length > 0) {
          draw = false
        }
      }
    }

    return draw
  }

  validateChessMove(id: number, move: Move) {
    const {player, opponent} = this.getPlayerById(id)
    const piece = this.board[move.oldPos.y][move.oldPos.x]

    if (!piece) return
    if (!this.isMoveLegal(piece, move.newPos)) return

    this.previousPos = cloneDeep(this.board)
    this.doMove(piece, move.newPos)

    this.player1.turn = !this.player1.turn
    this.player2.turn = !this.player2.turn

    this.updateLegalMoves()
    opponent.inCheck = this.checkCheck(this.board, opponent.king)

    if (this.checkMate(opponent)) {
      this.winner = player.id

    } else {
      if (this.checkDraw(opponent)) {
        this.winner = -1
      }
    }
  }

  isMoveLegal(piece: Piece, pos: Pos) {
    for (let m = 0; m < piece.legalMoves.length; m++) {
      if (piece.legalMoves[m].x === pos.x && piece.legalMoves[m].y === pos.y) {
        return true
      }
    }
    return false
  }

  getPlayerById(id: number) {
    if (id === this.player1.id) {
      return {player: this.player1, opponent: this.player2}
    }
    return {player: this.player2, opponent: this.player1}
  }

  createPieces() {
    for (let x = 0; x < 8; x++) {
      let y = 6
      this.board[y][x] = new Pawn(x, y, true)
    }

    for (let x = 0; x < 8; x++) {
      let y = 1
      this.board[y][x] = new Pawn(x, y, false)
    }

    this.board[0][3] = new Queen(3,0,false)
    this.board[7][3] = new Queen(3,7,true)

    this.board[0][2] = new Bishop(2,0,false)
    this.board[0][5] = new Bishop(5,0,false)
    this.board[7][2] = new Bishop(2,7,true)
    this.board[7][5] = new Bishop(5,7,true)

    this.board[0][1] = new Knight(1,0,false)
    this.board[0][6] = new Knight(6,0,false)
    this.board[7][1] = new Knight(1,7,true)
    this.board[7][6] = new Knight(6,7,true)

    this.board[0][0] = new Rook(0,0,false)
    this.board[0][7] = new Rook(7,0,false)
    this.board[7][0] = new Rook(0,7,true)
    this.board[7][7] = new Rook(7,7,true)

    this.board[0][4] = new King(4,0,false)
    this.board[7][4] = new King(4,7,true)

    if (this.player1.white) {
      this.player1.king = this.board[7][4]
      this.player2.king = this.board[0][4]
    } else {
      this.player1.king = this.board[0][4]
      this.player2.king = this.board[7][4]
    }
  }
}
