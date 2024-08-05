import { WebSocket } from "ws"
import { Connection } from "../../server"
import Piece from "./Piece"

export default class Player {
  id: number
  white: boolean
  turn: boolean
  ws: WebSocket
  inGame : boolean
  inQeue : boolean
  king: Piece
  inCheck : boolean

  constructor(connection: Connection, white: boolean) {
    this.id = connection.id
    this.ws = connection.ws
    this.white = white
    this.turn = white
    this.inGame = false
    this.inQeue = false
    this.king = new Piece(0,0,true)
    this.inCheck = false
  }
}
