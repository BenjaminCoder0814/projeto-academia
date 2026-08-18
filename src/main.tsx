import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ProvedorEstado } from './data/estado'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProvedorEstado>
      <App />
    </ProvedorEstado>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}
