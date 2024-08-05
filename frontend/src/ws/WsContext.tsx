import { createContext, ReactNode, useEffect, useState } from "react"
import WS from "./ws"

interface WsContextType {
  ws: WS | null
  setWs: (ws:WS) => void
}

const WsContext = createContext<WsContextType | undefined>(undefined)

interface WsProviderProps {
  children: ReactNode
}

const WsProvider: React.FC<WsProviderProps> = ({children}) => {
  const [ws, setWs] = useState<WS | null>(null)

  useEffect(() => {
    const newWs = new WS("ws://localhost:80")
    setWs(newWs)

    return ( ) => {
      if (ws) {
        if (ws.ws) {
          ws.ws.close()
        }
      }
    }
  }, [])

  return (
    <WsContext.Provider value={{ws, setWs}}>
      {children}
    </WsContext.Provider>
  )
}

export {WsContext, WsProvider}
