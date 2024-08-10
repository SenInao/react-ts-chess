import Game from "../../models/chess/Game";
import Player from "../../models/chess/Player";
import { Connection } from "../../server";
import {tenMinQeue, fiveMinQeue, threeMinQeue, games} from "./../../states/chess/state"

export default function matchmake(connections: Connection[]) {
  if (threeMinQeue.length >= 2) {
    createGame(threeMinQeue[0], threeMinQeue[1], 3, connections)
    threeMinQeue.splice(0,1)
    threeMinQeue.splice(0,1)
  } 

  if (fiveMinQeue.length >= 2) {
    createGame(fiveMinQeue[0], fiveMinQeue[1], 5, connections)
    fiveMinQeue.splice(0,1)
    fiveMinQeue.splice(0,1)
  } 

  if (tenMinQeue.length >= 2) {
    createGame(tenMinQeue[0], tenMinQeue[1], 10, connections)
    tenMinQeue.splice(0,1)
    tenMinQeue.splice(0,1)
  }
}

function createGame(connection1: Connection, connection2: Connection, duration: number, connections: Connection[]) {
  const white = Math.floor(Math.random())
  const player1 = new Player(connection1, white === 0)
  const player2 = new Player(connection2, white === 1)
  const game = new Game(player1, player2, duration, connections)

  connection1.chess.inQeue = false
  connection2.chess.inQeue = false
  connection1.chess.game = game
  connection2.chess.game = game

  games.push(game)
}
