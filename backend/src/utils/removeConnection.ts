import { WebSocket } from "ws";
import { Connection } from "./../server"
import { threeMinQeue, fiveMinQeue, tenMinQeue } from "../states/chess/state";

export default function removeConnection(ws: WebSocket, usersConnected: Connection[]) {
  removeConnectionFromList(ws, threeMinQeue)
  removeConnectionFromList(ws, fiveMinQeue)
  removeConnectionFromList(ws, tenMinQeue)
  removeConnectionFromList(ws, usersConnected)
}


function removeConnectionFromList(ws: WebSocket, list: Connection[]) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].ws === ws) {
      list.splice(i, 1)
      break
    }
  }
}
