import {Connection} from "./../server"
import { WebSocket } from "ws";

export default function indexByWs(ws: WebSocket, usersConnected: Connection[]) {
  for (let i = 0; i < usersConnected.length; i++) {
    if (usersConnected[i].ws === ws) {
      return i
    }
  }

  return -1
}
