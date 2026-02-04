import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import DocumentosPage from './pages/DocumentosPage.jsx'

// GovBR-DS Core CSS (contém todos os estilos necessários)
import '@govbr-ds/core/dist/core.min.css'

// Estilos customizados
import './index.css'

function Router() {
  const [route, setRoute] = useState(window.location.hash || '#/')

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (route === '#/documentos') {
    return <DocumentosPage />
  }
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
