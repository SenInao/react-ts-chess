import {Connection, Packet} from "./../server"

export default function broadcast(connections: Connection[], packet: Packet) {
  connections.forEach(conn => {
    conn.ws.send(JSON.stringify(packet))
  })
}
