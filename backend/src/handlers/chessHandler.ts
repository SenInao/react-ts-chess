import {Connection, Packet} from "./../server"
import { threeMinQeue, fiveMinQeue, tenMinQeue, games} from "../states/chess/state"
import { WebSocket } from "ws"
import indexByWs from "../utils/indexByWs"
import matchmake from "../GameLogic/chess/matchmake"
import { removeConnectionFromList } from "../utils/removeConnection"

export default function chessHandler(packet: Packet, ws: WebSocket, usersConnected: Connection[]) {
  const i = indexByWs(ws, usersConnected)

  if (i === -1) {
    throw new Error("connection not found")
  }

  var returnPacket: Packet | null = null

  if (packet.action === "matchmake") {
    if (usersConnected[i].chess.inQeue || usersConnected[i].chess.inGame) {throw new Error("already in qeue")}
    if (packet.payload.min === 3) {
      threeMinQeue.push(usersConnected[i])
    } else if (packet.payload.min === 5) {
      fiveMinQeue.push(usersConnected[i])
    } else if (packet.payload.min === 10) {
      tenMinQeue.push(usersConnected[i])
    } else {
      throw new Error("minutes not defined")
    }
    usersConnected[i].chess.inQeue = true
    matchmake(usersConnected)

  } else if (packet.action === "matchmakeCancel") {
    removeConnectionFromList(usersConnected[i].ws, threeMinQeue)
    removeConnectionFromList(usersConnected[i].ws, fiveMinQeue)
    removeConnectionFromList(usersConnected[i].ws, tenMinQeue)
    usersConnected[i].chess.inQeue = false

  } else if (packet.action === "getGamestate") {
    if (!usersConnected[i].chess.game) {
      throw new Error("not in game")
    }

    const payload = usersConnected[i].chess.game?.gameState()

    returnPacket = {
      id: packet.id,
      action: "getGamestate",
      payload: payload
    }

  } else if (packet.action === "move") {
    const game = usersConnected[i].chess.game
    if (game !== null) {
      game.validateChessMove(usersConnected[i].id, packet.payload)
      game.broadcastGamestate()
    }
  }

  if (!returnPacket) {
    var returnPacket: Packet | null= {
      id: packet.id,
      action: packet.action,
      payload: {status: true}
    }
  }

  ws.send(JSON.stringify(returnPacket))
}
