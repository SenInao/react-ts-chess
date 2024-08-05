import {WebSocketServer, WebSocket} from "ws"
import handler from "./handlers/actionHandler"
import removeConnection from "./utils/removeConnection"

import dotenv from "dotenv"
import Game from "./models/chess/Game"
dotenv.config()

interface chessInfo {
  inGame : boolean
  inQeue : boolean
  game : Game | null
}


export interface Connection {
  id: number
  ws: WebSocket
  chess : chessInfo
}

export interface Packet {
  id: number
  action: string
  payload: any
}

const usersConnected: Connection[] = []
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

const wss = new WebSocketServer({port})
console.log("Server running at ws//localhost:" + port)

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    try {
      const packet: Packet = JSON.parse(data.toString())
      handler(packet, ws, usersConnected)
    } catch (error) {
      console.log(error)
    }
  })

  ws.on("close", () => {
    removeConnection(ws, usersConnected)
  })

  ws.on("error", () => {
    removeConnection(ws, usersConnected)
  })
})
