import { Connection } from "../../server";
import { Packet } from "../../server";
import posInList from "../../utils/chess/posInList";
import Piece, { Bishop, King, Knight, Pawn, Pos, Queen, Rook } from "./Piece";
import Player from "./Player";
import cloneDeep from "lodash/cloneDeep"
import indexByWs from "../../utils/indexByWs";

interface Move {
  oldPos : Pos
  newPos : Pos
}


export default class Game {
  player1: Player
  player2: Player
  board: (Piece | null)[][] = Array.from({length: 8}, () => Array(8).fill(null))
  previousPos : (Piece | null)[][] = Array.from({length: 8}, () => Array(8).fill(null))
  winner: number
  connections : Connection[]

  constructor(player1: Player, player2: Player, gameDuration : number, connections: Connection[]) {
    this.connections = connections
    this.player1 = player1
    this.player2 = player2
    this.winner = 0

    player1.inGame = true
    player2.inGame = true
    player1.clock = gameDuration * 60
    player2.clock = gameDuration * 60

    this.previousPos = cloneDeep(this.board)

    this.createPieces()
    this.updateLegalMoves()

    this.broadcastGamestate()
  }

  broadcastGamestate() {
    this.broadcast("gameState", this.gameState())
  }

  broadcast(action: string, message: any) {
    const packet: Packet = {
      id: -1,
      action: "chess-" + action,
      payload: message
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
      rook.firstMove = false
      this.updatePosition(rook, {x: 5, y: pos.y})

    } else if (pos.specialMove === "queensidecastle") {
      let rook = this.board[pos.y][0]
      if (!rook) return
      rook.firstMove = false
      this.updatePosition(rook, {x: 3, y: pos.y})

    } 

    if (pos.specialMove === "promotion") {
      this.board[piece.pos.y][piece.pos.x] = null
      piece = new Queen(pos.x, pos.y, piece.white)
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
    const legalMove = this.getMove(piece, move.newPos)
    if (!legalMove) return

    this.previousPos = cloneDeep(this.board)
    this.doMove(piece, legalMove)

    this.player1.turn = !this.player1.turn
    this.player2.turn = !this.player2.turn

    if (this.player1.turn) {
      this.player1.startTimer(this)
      this.player2.stopTimer()
    } else {
      this.player2.startTimer(this)
      this.player1.stopTimer()
    }

    this.updateLegalMoves()
    opponent.inCheck = this.checkCheck(this.board, opponent.king)

    if (this.checkMate(opponent)) {
      this.winner = player.id
      this.endGame()
    } else if (this.checkDraw(opponent)){
      this.winner = -1
      this.endGame()
    }
  }

  getMove(piece: Piece, pos: Pos) {
    for (let m = 0; m < piece.legalMoves.length; m++) {
      if (piece.legalMoves[m].x === pos.x && piece.legalMoves[m].y === pos.y) {
        return piece.legalMoves[m]
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

  gameState() {
    const player1 = {
      turn: this.player1.turn,
      id: this.player1.id,
      white: this.player1.white,
      clock: this.player1.clock
    }
    const player2 = {
      turn: this.player2.turn,
      id: this.player2.id,
      white: this.player2.white,
      clock: this.player2.clock
    }
    return {
      board: this.board,
      player1: player1,
      player2: player2,
      winner: this.winner
    }
  }

  endGame() {
    this.player1.stopTimer()
    this.player2.stopTimer()
    let i  = indexByWs(this.player1.ws, this.connections)
    if (i !== -1) {
      this.connections[i].chess.game = null
      this.connections[i].chess.inGame = false
    }
    i  = indexByWs(this.player2.ws, this.connections)
    if (i !== -1) {
      this.connections[i].chess.game = null
      this.connections[i].chess.inGame = false
    }
    this.broadcastGamestate()
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
