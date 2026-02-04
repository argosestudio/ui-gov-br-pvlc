import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// GovBR-DS Core CSS (contém todos os estilos necessários)
import '@govbr-ds/core/dist/core.min.css'

// Estilos customizados
import './index.css'

// Pages
import MenuPage from './pages/MenuPage'
import ProjetoPage from './pages/ProjetoPage'
import DadosInternosPage from './pages/DadosInternosPage'
import DocumentosPage from './pages/DocumentosPage'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/dados-projetos" element={<ProjetoPage />} />
        <Route path="/dados-internos" element={<DadosInternosPage />} />
        <Route path="/docs-necessarios" element={<DocumentosPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
