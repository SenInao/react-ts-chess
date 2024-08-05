import ReactDOM from 'react-dom/client'
import App from './App';
import { WsProvider } from './ws/WsContext';
import "./index.css"

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <WsProvider>
    <App/>
  </WsProvider>
);
