import { WebSocket } from "ws"
import {Connection, Packet} from "./../server"

function generateId(connections: Connection[]) {
  var id = 0
  while (true) {
    for (let i = 0; i < connections.length; i++) {
      if (id === connections[i].id) {
        id+=1
        continue
      }
    }
    break
  }
  return id
}

export default function register(packet: Packet, ws: WebSocket, connections: Connection[]) {
  const connection: Connection = {
    id: generateId(connections),
    ws: ws,
    chess : {
      inQeue : false,
      inGame : false,
      game : null,
    }
  }

  return connection
}
