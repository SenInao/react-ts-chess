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
}

export interface GameInterface {
  pieces: Piece[]
  player1: Player
  player2: Player
}

interface Mouse {
  x : number,
  y : number,
  pressed : boolean
  pieceToMove : Piece | null
}

const BROWN = "rgba(160,82,45)"
const LIGTH_BRWON = "rgba(196, 164, 132)"

export class GameClass {
  ws : WS
  gamestate : GameInterface
  context : CanvasRenderingContext2D
  canvas : HTMLCanvasElement
  cellWidth : number
  width : number
  mouse : Mouse
  pieceImages: { [key: string]: HTMLImageElement }
  player : Player

  constructor(ws: WS, gamestate: GameInterface, context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ws = ws

    this.handler = this.handler.bind(this)
    this.ws.defaultHandler = this.handler

    this.gamestate = gamestate
    this.context = context
    this.canvas = canvas
    this.width = Math.min(window.innerWidth, window.innerHeight)*0.9
    this.cellWidth = this.width/8

    if (this.gamestate.player1.id === ws.id) {
      this.player = this.gamestate.player1
    } else {
      this.player = this.gamestate.player2
    }

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
    this.animate()
  }

  handler(packet: Packet) {
    if (packet.action === "chess-gameState") {
      this.gamestate = packet.payload
      if (!this.player.white) {
        this.reverseBoard()
      }
      
      if (this.gamestate.player1.id === this.ws.id) {
        this.player = this.gamestate.player1
      } else {
        this.player = this.gamestate.player2
      }
    }
  }

  reverseBoard() {
    this.gamestate.pieces.forEach(piece => {
      piece.pos.x = Math.abs(piece.pos.x - 7)
      piece.pos.y = Math.abs(piece.pos.y - 7)

      piece.legalMoves.forEach(move => {
        move.x = this.reverseValue(move.x)
        move.y = this.reverseValue(move.y)
      })
    })
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
        this.pieceImages[color + piece] = img
      })
    })
  }

  initEventListeners() {
    window.addEventListener("mousedown", (event) => {
      if (!this.player.turn) return

      const canvasRect = this.canvas.getBoundingClientRect()
      this.mouse.x = event.clientX - canvasRect.left
      this.mouse.y = event.clientY - canvasRect.top
      this.mouse.pressed = true

      const i = this.checkCollision(this.mouse.x, this.mouse.y)
      if (i !== -1) {
        if (this.player.white === this.gamestate.pieces[i].white) {
          this.mouse.pieceToMove = this.gamestate.pieces[i]
          this.animate()
        }
      }
    })

    window.addEventListener("mouseup", (event) => {
      if (!this.player.turn) return
      const canvasRect = this.canvas.getBoundingClientRect()
      this.mouse.x = event.clientX - canvasRect.left
      this.mouse.y = event.clientY - canvasRect.top
      this.mouse.pressed = false

      const i = this.checkCollision(this.mouse.x, this.mouse.y)

      if ((i === -1 || this.gamestate.pieces[i].white !== this.player.white) && this.mouse.pieceToMove) {
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
        } else  {
          oldPos = this.mouse.pieceToMove.pos
          newPos = {x:x,y:y}
        }

        this.ws.send("chess-move", {oldPos: oldPos, newPos: newPos})
      }

      this.mouse.pieceToMove = null
    })

    window.addEventListener("mousemove", (event) => {
      if (!this.player.turn) return
      if (this.mouse.pieceToMove) {
        const canvasRect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - canvasRect.left;
        this.mouse.y = event.clientY - canvasRect.top;
      }
    });
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
    this.gamestate.pieces.forEach(piece => {
      var fc = piece.white? "W" : "B"
      var image = this.pieceImages[fc + piece.type]

      if (this.mouse.pieceToMove === piece) {
        this.drawPossibleMoves(piece)
        this.context.drawImage(image, this.mouse.x - this.cellWidth/2,this.mouse.y - this.cellWidth/2, this.cellWidth,this.cellWidth)
      } else {
        this.context.drawImage(image, piece.pos.x*this.cellWidth,piece.pos.y*this.cellWidth, this.cellWidth,this.cellWidth)
      }
    })
  }

  drawPossibleMoves(piece: Piece) {
    piece.legalMoves.forEach(move => {
      this.context.beginPath()
      this.context.fillStyle = "gray"
      this.context.arc(move.x*this.cellWidth + this.cellWidth/2, move.y*this.cellWidth + this.cellWidth/2, this.cellWidth/5, 0, Math.PI*2)
      this.context.fill()
      this.context.closePath()
    })
  }

  checkCollision(x: number, y: number) {
    for (let i = 0; i < this.gamestate.pieces.length; i++) {
      const piece = this.gamestate.pieces[i];
      const pieceX = piece.pos.x * this.cellWidth;
      const pieceY = piece.pos.y * this.cellWidth;

      if (
        x >= pieceX && x < pieceX + this.cellWidth &&
          y >= pieceY && y < pieceY + this.cellWidth
      ) {
        return i;
      }
    }

    return -1;
  }

  draw() {
    this.context.clearRect(0,0, this.width, this.width)
    this.drawBoard()
    this.drawPieces()
  }

  animate() {
    this.draw()
    requestAnimationFrame(() => this.animate())
  }
}
