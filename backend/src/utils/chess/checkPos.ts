import {Pos} from "./../../models/chess/Piece"
import Game from "./../../models/chess/Game"

export default function checkPos(pos: Pos, game: Game) {
  for (let i = 0; i < game.pieces.length; i++) {
    if (game.pieces[i].pos.x === pos.x && game.pieces[i].pos.y === pos.y) {
      return i
    }
  }

  return -1
}
