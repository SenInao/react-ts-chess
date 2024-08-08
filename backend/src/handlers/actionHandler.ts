import { WebSocket } from "ws";
import { Connection, Packet } from "../server";
import register from "../controllers/register";
import chessHandler from "./chessHandler";

export default function handler(packet: Packet, ws: WebSocket, usersConnected: Connection[]) {
  try {
    let action = packet.action.split("-")
    if (action[0] === "register") {
      const connnection = register(packet, ws, usersConnected)
      usersConnected.push(connnection)

      const returnPacket: Packet = {
        id: packet.id,
        action: packet.action,
        payload: {status: true, id: connnection.id}
      }

      ws.send(JSON.stringify(returnPacket))

    } else if (action[0] === "chess") {
      action.splice(0, 1)
      packet.action = action.toString()
      chessHandler(packet, ws, usersConnected)
    }

  } catch (error: any) {
    const returnPacket: Packet = {
      id: packet.id,
      action: packet.action,
      payload: {status: false, error: error}
    }

    ws.send(JSON.stringify(returnPacket))
  }
}
