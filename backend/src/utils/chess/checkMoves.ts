import Game from "../../models/chess/Game";
import Piece from "../../models/chess/Piece";

export function checkVerticalDir(piece: Piece, game:Game) {
  const moves = []
  for (let y = piece.pos.y-1; y >= 0; y--) {
    const pieceAtPos = game.board[y][piece.pos.x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: piece.pos.x, y: y})
      }
      break
    }
    moves.push({x: piece.pos.x, y: y})
  }

  for (let y = piece.pos.y+1; y < 8; y++) {
    const pieceAtPos = game.board[y][piece.pos.x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: piece.pos.x, y: y})
      }
      break
    }
    moves.push({x: piece.pos.x, y: y})
  }

  return moves
}

export function checkHorizontalDir(piece: Piece, game:Game) {
  const moves = []
  for (let x = piece.pos.x-1; x >= 0; x--) {
    const pieceAtPos = game.board[piece.pos.y][x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x:x, y: piece.pos.y})
      }
      break
    }
    moves.push({x:x, y: piece.pos.y})
  }

  for (let x = piece.pos.x+1; x < 8; x++) {
    const pieceAtPos = game.board[piece.pos.y][x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: x, y: piece.pos.y})
      }
      break
    }
    moves.push({x:x, y: piece.pos.y})
  }

  return moves
}


export function checkDiagonals(piece: Piece, game: Game) {
  const moves = [];

  for (let x = piece.pos.x - 1, y = piece.pos.y - 1; x >= 0 && y >= 0; x--, y--) {
    const pieceAtPos = game.board[y][x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: x, y: y});
      }
      break;
    }
    moves.push({x: x, y: y});
  }

  for (let x = piece.pos.x - 1, y = piece.pos.y + 1; x >= 0 && y < 8; x--, y++) {
    const pieceAtPos = game.board[y][x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: x, y: y});
      }
      break;
    }
    moves.push({x: x, y: y});
  }

  for (let x = piece.pos.x + 1, y = piece.pos.y + 1; x < 8 && y < 8; x++, y++) {
    const pieceAtPos = game.board[y][x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: x, y: y});
      }
      break;
    }
    moves.push({x: x, y: y});
  }

  for (let x = piece.pos.x + 1, y = piece.pos.y - 1; x < 8 && y >= 0; x++, y--) {
    const pieceAtPos = game.board[y][x]
    if (pieceAtPos) {
      if (pieceAtPos.white !== piece.white) {
        moves.push({x: x, y: y});
      }
      break;
    }
    moves.push({x: x, y: y});
  }

  return moves;
}
