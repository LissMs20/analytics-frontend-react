import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'; // Importar ThemeProvider
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ✅ Envolvemos o App com o ThemeProvider */}
    <ThemeProvider> 
      <App />
    </ThemeProvider>
  </StrictMode>,
)
