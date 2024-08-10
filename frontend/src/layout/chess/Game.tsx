import { useContext, useEffect, useState, useRef } from "react"
import { Packet } from "../../ws/ws"
import { WsContext } from "../../ws/WsContext"
import {GameInterface, GameClass} from "./script"
import "./gamestyle.css"
import { useNavigate } from "react-router-dom"

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clockRef = useRef<HTMLDivElement>(null)
  const oppClockRef = useRef<HTMLDivElement>(null)
  const gamestatus = useRef<HTMLLabelElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)

  const [gamestate, setGamestate] = useState<GameInterface | null>(null)
  const wsContext = useContext(WsContext)
  const navigate = useNavigate()
  
  function gameEnd() {
    if (!backButton.current) return
    backButton.current.style.display = "block"
  }

  function callback(packet: Packet) {
    if (packet.payload.status === false) {
      navigate("/")
      return
    }
    const gamestate = packet.payload
    setGamestate(gamestate)
    if (!canvasRef.current) return
    const context = canvasRef.current.getContext("2d")
    if (!context) return
    if (!gamestate) return
    if (!ws) return
    if (!clockRef.current) return
    if (!oppClockRef.current) return
    if (!gamestatus.current) return
    const game = new GameClass(ws, gamestate, context, canvasRef.current, clockRef.current, oppClockRef.current)
    game.gamestatusRef = gamestatus.current
    game.endGameCall = gameEnd
  }
  
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  }


  useEffect(() => {
    if (gamestate) return
    if (!ws) return
    if (!ws.state) {
      ws.onOpenCall = () => {
        ws.send("chess-getGamestate", {}, callback)
      }
    } else {
      ws.send("chess-getGamestate", {}, callback)
    }
  }, [])

  if (!wsContext) {
    return <div></div>
  }

  const {ws} = wsContext

  return (
    <div className="ChessGame">
      <section>
        <label ref={gamestatus}>Won</label>
        <div ref={oppClockRef} className="runningClock">
          {formatTime(0)}
        </div>
      </section>
      <canvas ref={canvasRef}></canvas>
      <section>
        <button ref={backButton} className={"back-button"} onClick={() => navigate("/")}>Back</button>
        <div ref={clockRef} className="clock">
          {formatTime(0)}
        </div>
      </section>
    </div>
  )
}

export default Game
