import {games} from "./../../states/chess/state"
import { Connection } from "../../server"

export default function findGameByConn(connection: Connection) {
  for (let i = 0; i < games.length; i++) {
    if (connection === games[i].player1.connection || connection === games[i].player2.connection) {
      return i
    }
  }
}
