import { WebSocket } from "ws"
import { Connection } from "../../server"
import Piece from "./Piece"
import Game from "./Game"

export default class Player {
  id: number
  white: boolean
  turn: boolean
  ws: WebSocket
  inGame : boolean
  inQeue : boolean
  king: Piece
  inCheck : boolean
  clock : number
  timerId : number | undefined | NodeJS.Timeout

  constructor(connection: Connection, white: boolean) {
    this.id = connection.id
    this.ws = connection.ws
    this.white = white
    this.turn = white
    this.inGame = false
    this.inQeue = false
    this.king = new Piece(0,0,true)
    this.inCheck = false
    this.clock = 0
  }

  startTimer(game: Game) {
    game.broadcast("timerUpdate", {player: this.id, time : this.clock})
    this.timerId = setInterval(() => {
      this.clock--
      game.broadcast("timerUpdate", {player: this.id, time : this.clock})
      
      if (this.clock <= 0) {
        if (game.player1.id === this.id) {
          game.winner = game.player2.id
        } else {
          game.winner = game.player1.id
        }
        game.endGame()
        clearInterval(this.timerId)
        this.timerId = undefined
      }
    }, 1000)
  }

  stopTimer() {
    clearInterval(this.timerId)
    this.timerId = undefined
  }
}
