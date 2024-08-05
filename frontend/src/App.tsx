import React, { useContext } from "react"
import Chess from "./layout/chess/Chess"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import "./App.css"
import { WsContext } from "./ws/WsContext"
import Game from "./layout/chess/Game"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Chess/>
  },
  {
    path: "/chess/game",
    element: <Game/>
  }
])

const App: React.FC = () => {
  const wsContext = useContext(WsContext)
  if (!wsContext) {
    throw new Error("Context missing")
  }

  const {ws} = wsContext

  if (!ws) {
    return <div></div>
  }

  return (
    <div className="App">
      <RouterProvider router={router}/>
    </div>
  )
}

export default App
