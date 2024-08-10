import { WebSocket } from "ws";
import { Connection } from "./../server"
import { threeMinQeue, fiveMinQeue, tenMinQeue } from "../states/chess/state";
import indexByWs from "./indexByWs";

export default function removeConnection(ws: WebSocket, usersConnected: Connection[]) {
  removeConnectionFromList(ws, threeMinQeue)
  removeConnectionFromList(ws, fiveMinQeue)
  removeConnectionFromList(ws, tenMinQeue)

  const i = indexByWs(ws, usersConnected)
  const game = usersConnected[i].chess.game
  if (game) {
    if (usersConnected[i].id === game.player1.id) {
      game.winner = game.player2.id
    } else {
      game.winner = game.player1.id
    }
    game.endGame()
  }

  removeConnectionFromList(ws, usersConnected)
}

export function removeConnectionFromList(ws: WebSocket, list: Connection[]) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].ws === ws) {
      list.splice(i, 1)
      break
    }
  }
}
