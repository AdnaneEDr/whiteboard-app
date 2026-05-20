import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'   // ← CRITIQUE : ce fichier DOIT être importé ici
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
