import {Pos} from "./../../models/chess/Piece"

export default function posInList(pos: Pos, list: Pos[]) {
  for (let i = 0; i < list.length; i++) {
    if (pos.x === list[i].x && pos.y === list[i].y) {
      return true
    }
  }
  return false
}
