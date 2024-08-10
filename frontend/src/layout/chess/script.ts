import WS, { Packet } from "./../../ws/ws"

interface Pos {
  x: number
  y: number
}

interface Piece {
  type: string
  pos: Pos
  firstMove: boolean
  legalMoves: Pos[]
  white: boolean
}

interface Player {
  turn : boolean
  white : boolean
  id : number
  clock : number
}

export interface GameInterface {
  board: (Piece | null)[][]
  player1: Player
  player2: Player
  winner: number
}

interface Mouse {
  x : number,
  y : number,
  pressed : boolean
  pieceToMove : Piece | null
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${formattedMinutes}:${formattedSeconds}`;
}

const BROWN = "rgba(160,82,45)"
const LIGTH_BRWON = "rgba(196, 164, 132)"

export class GameClass {
  ws : WS
  gamestate : GameInterface
  context : CanvasRenderingContext2D
  canvas : HTMLCanvasElement
  cellWidth : number
  width : number = 0
  mouse : Mouse
  pieceImages: { [key: string]: HTMLImageElement }
  player : Player
  opponent : Player
  playerClock : HTMLDivElement
  oppClock : HTMLDivElement
  gamestatusRef : HTMLLabelElement | undefined
  running: boolean
  endGameCall : () => void

  constructor(ws: WS, gamestate: GameInterface, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, playerClock : HTMLDivElement, oppClock : HTMLDivElement) {
    this.ws = ws

    this.handler = this.handler.bind(this)
    this.ws.defaultHandler = this.handler

    this.gamestate = gamestate
    this.context = context
    this.canvas = canvas
    this.setWidth()
    this.cellWidth = this.width/8
    this.playerClock = playerClock
    this.oppClock = oppClock
    this.running = true
    this.endGameCall = () => {}

    if (this.gamestate.player1.id === ws.id) {
      this.player = this.gamestate.player1
      this.opponent = this.gamestate.player2
    } else {
      this.player = this.gamestate.player2
      this.opponent = this.gamestate.player1
    }

    this.playerClock.innerText = formatTime(this.player.clock)
    this.oppClock.innerText = formatTime(this.opponent.clock)

    if (!this.player.white) {
      this.reverseBoard()
    }

    this.canvas.width = this.width
    this.canvas.height = this.width

    this.pieceImages = {}

    this.mouse = {
      x : 0,
      y : 0,
      pressed : false,
      pieceToMove : null
    }

    this.preloadImages()
    this.initEventListeners()
    this.draw()
  }

  handler(packet: Packet) {
    if (packet.action === "chess-gameState") {
      this.gamestate = packet.payload

      if (!this.player.white) {
        this.reverseBoard()
      }
      
      if (this.gamestate.player1.id === this.ws.id) {
        this.player = this.gamestate.player1
        this.opponent = this.gamestate.player2
      } else {
        this.player = this.gamestate.player2
        this.opponent = this.gamestate.player1
      }


      if (this.gamestate.winner) {
        if (!this.gamestatusRef) {
          return
        }
        this.gamestatusRef.style.display = "block"
        this.running = false
        this.endGameCall()
        if (this.gamestate.winner === -1) {
          this.gamestatusRef.innerText = "Draw"
        } else if (this.player.id === this.gamestate.winner) {
          this.gamestatusRef.innerText = "Won"
          this.gamestatusRef.className = "won-label"
        } else {
          this.gamestatusRef.innerText = "Lost"
          this.gamestatusRef.className = "lost-label"
        }
      }

      this.draw()

    } else if (packet.action === "chess-timerUpdate") {
      if (packet.payload.player === this.player.id) {
        this.player.clock = packet.payload.time
        this.playerClock.innerText = formatTime(this.player.clock)
        this.playerClock.className = "runningClock"
        this.oppClock.className = "clock"

      } else {
        this.opponent.clock = packet.payload.time
        this.oppClock.innerText = formatTime(this.opponent.clock)
        this.oppClock.className = "runningClock"
        this.playerClock.className = "clock"
      }
    }
  }

  reverseBoard() {
    const newArr : (Piece | null)[][] = Array.from({length:8}, () => Array(8).fill(null))
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = this.gamestate.board[y][x]
        if (!piece) continue

        piece.pos.x = this.reverseValue(piece.pos.x)
        piece.pos.y = this.reverseValue(piece.pos.y)


        newArr[piece.pos.y][piece.pos.x] = piece

        piece.legalMoves.forEach(move => {
          move.x = this.reverseValue(move.x)
          move.y = this.reverseValue(move.y)
        })
      }
    }

    this.gamestate.board = newArr
  }

  reverseValue(value: number) {
    return Math.abs(value - 7)
  }

  preloadImages() {
    const pieces = ["K", "Q", "R", "B", "Kn", "P"]
    const colors = ["W", "B"]
    pieces.forEach((piece:string) => {
      colors.forEach((color:string) => {
        const img = new Image()
        img.src = process.env.PUBLIC_URL + "/chess_pieces/" + color + piece + ".png"
        img.onload = () => this.draw()
        this.pieceImages[color + piece] = img
      })
    })
  }

  setMousePosition(event: MouseEvent) {
    const canvasRect = this.canvas.getBoundingClientRect()
    this.mouse.x = event.clientX - canvasRect.left
    this.mouse.y = event.clientY - canvasRect.top
  }

  initEventListeners() {
    window.addEventListener("mousedown", (event) => {
      if (!this.player.turn || !this.running) return
      this.setMousePosition(event)
      this.mouse.pressed = true

      const piece = this.checkCollision(this.mouse.x, this.mouse.y)
      if (piece) {
        if (this.player.white === piece.white) {
          this.mouse.pieceToMove = piece
          this.animate()
        }
      }
    })

    window.addEventListener("mouseup", (event) => {
      if (!this.player.turn || !this.running) return
      if (!this.mouse.pieceToMove) return
      this.setMousePosition(event)
      this.mouse.pressed = false

      const piece = this.checkCollision(this.mouse.x, this.mouse.y)

      if (!piece || piece.white !== this.player.white) {
        const x = Math.floor(this.mouse.x/this.cellWidth)
        const y = Math.floor(this.mouse.y/this.cellWidth)
        var oldPos
        var newPos

        if (!this.player.white) {
          oldPos = {
            x:this.reverseValue(this.mouse.pieceToMove.pos.x),
            y:this.reverseValue(this.mouse.pieceToMove.pos.y)
          }
          newPos = {
            x:this.reverseValue(x),
            y:this.reverseValue(y),
          }
          this.mouse.pieceToMove.pos = {x: x, y:y}
        } else  {
          oldPos = this.mouse.pieceToMove.pos
          newPos = {x:x,y:y}
          this.mouse.pieceToMove.pos = newPos
        }

        this.ws.send("chess-move", {oldPos: oldPos, newPos: newPos})
      }

      this.mouse.pieceToMove = null
    })

    window.addEventListener("mousemove", (event) => {
      if (!this.player.turn || !this.running) return
      if (this.mouse.pieceToMove) {
        this.setMousePosition(event)
      }
    });

    window.addEventListener("resize", () => {
      this.resize()
    })

    window.addEventListener("click", (event) => {
      if (!this.player.turn || !this.running) return
      this.setMousePosition(event)
      const piece = this.checkCollision(this.mouse.x, this.mouse.y)

      if ((!piece || piece.white !== this.player.white) && this.mouse.pieceToMove) {
        const x = Math.floor(this.mouse.x/this.cellWidth)
        const y = Math.floor(this.mouse.y/this.cellWidth)
        var oldPos
        var newPos

        if (!this.player.white) {
          oldPos = {
            x:this.reverseValue(this.mouse.pieceToMove.pos.x),
            y:this.reverseValue(this.mouse.pieceToMove.pos.y)
          }
          newPos = {
            x:this.reverseValue(x),
            y:this.reverseValue(y),
          }
          this.mouse.pieceToMove.pos = {x: x, y:y}
        } else  {
          oldPos = this.mouse.pieceToMove.pos
          newPos = {x:x,y:y}
          this.mouse.pieceToMove.pos = newPos
        }

        this.ws.send("chess-move", {oldPos: oldPos, newPos: newPos})
      } else if (!this.mouse.pieceToMove && piece) {
        if (this.player.white === piece.white) {
          this.mouse.pieceToMove = piece
        }
      }
    })
  }

  drawBoard() {
    const rows = 8
    const cols = 8

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * this.cellWidth;
        const y = row * this.cellWidth;

        this.context.beginPath();
        this.context.rect(x, y, this.cellWidth, this.cellWidth);

        if ((row + col) % 2 === 0) {
          this.context.fillStyle = LIGTH_BRWON;
        } else {
          this.context.fillStyle = BROWN;
        }

        this.context.fill();
        this.context.closePath();
      }
    }
  }

  drawPieces() {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.gamestate.board[row][col];
        if (!piece || piece === this.mouse.pieceToMove) continue;

        const img = this.pieceImages[(piece.white ? "W" : "B") + piece.type];
        this.context.rect(piece.pos.x * this.cellWidth, piece.pos.y * this.cellWidth, 10, 10)
        this.context.drawImage(
          img,
          piece.pos.x * this.cellWidth,
          piece.pos.y * this.cellWidth,
          this.cellWidth,
          this.cellWidth
        );
      }
    }
  }

  drawDraggedPiece() {
    if (this.mouse.pieceToMove) {
      const piece = this.mouse.pieceToMove;
      this.drawPossibleMoves(piece);
      const img = this.pieceImages[(piece.white ? "W" : "B") + piece.type];
      
      if (!this.mouse.pressed) {
        this.context.rect(piece.pos.x * this.cellWidth, piece.pos.y * this.cellWidth, 10, 10)
        this.context.drawImage(
          img,
          piece.pos.x * this.cellWidth,
          piece.pos.y * this.cellWidth,
          this.cellWidth,
          this.cellWidth
        );
        return
      }

      this.context.beginPath();
      this.context.drawImage(
        img,
        this.mouse.x - this.cellWidth / 2,
        this.mouse.y - this.cellWidth / 2,
        this.cellWidth,
        this.cellWidth
      );
      this.context.closePath();
    }
  }

  drawPossibleMoves(piece: Piece) {
    piece.legalMoves.forEach(move => {
      this.context.beginPath()
      if (this.checkCollision(move.x*this.cellWidth,move.y*this.cellWidth)) {
        this.context.lineWidth = 5
        this.context.strokeStyle = "gray"
        this.context.arc(move.x*this.cellWidth + this.cellWidth/2, move.y*this.cellWidth + this.cellWidth/2, this.cellWidth/2.2, 0, Math.PI*2)
        this.context.stroke()
      } else {
        this.context.fillStyle = "gray"
        this.context.arc(move.x*this.cellWidth + this.cellWidth/2, move.y*this.cellWidth + this.cellWidth/2, this.cellWidth/5, 0, Math.PI*2)
        this.context.fill()
      }
      this.context.closePath()
    })
  }

  checkCollision(xPos: number, yPos: number) {
    const x = Math.floor(xPos/this.cellWidth)
    const y = Math.floor(yPos/this.cellWidth)
    return this.gamestate.board[y][x]
  }

  draw() {
  this.context.clearRect(0, 0, this.width, this.width);
  this.drawBoard();
  this.drawPieces();
  this.drawDraggedPiece();
  }

  animate() {
    this.draw()
    if (this.mouse.pieceToMove && this.mouse.pressed) {
      requestAnimationFrame(() => this.animate())
    }
  }

  setWidth() {
    if (window.innerWidth < 780 && window.innerWidth < window.innerHeight*0.7) {
      this.width = window.innerWidth
    } else {
      this.width = window.innerHeight * 0.7
    }
  }

  resize() {
    this.setWidth()
    this.cellWidth = this.width/8
    this.canvas.width = this.width
    this.canvas.height = this.width
    this.draw()
  }

}
