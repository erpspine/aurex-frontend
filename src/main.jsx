import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import GlobalSidebarToggle from './components/GlobalSidebarToggle.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalSidebarToggle />
    <App />
  </StrictMode>,
)
