import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style/index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'; // <--- Import

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)