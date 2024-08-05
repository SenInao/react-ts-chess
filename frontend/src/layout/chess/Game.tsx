import { useContext, useEffect, useState, useRef } from "react"
import { Packet } from "../../ws/ws"
import { WsContext } from "../../ws/WsContext"
import {GameInterface, GameClass} from "./script"
import "./gamestyle.css"

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gamestate, setGamestate] = useState<GameInterface | null>(null)
  const wsContext = useContext(WsContext)

  function callback(packet: Packet) {
    const gamestate = packet.payload
    setGamestate(gamestate)
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return
    if (!gamestate) return
    if (!ws) return
    const game = new GameClass(ws, gamestate, context, canvasRef.current)
  }

  useEffect(() => {
    if (!ws) return
    ws.send("chess-getGamestate", {}, callback)
  }, [])

  if (!wsContext) {
    return <div></div>
  }

  const {ws} = wsContext

  return (
    <div className="ChessGame">
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default Game
