import { useState, useEffect } from 'react'
import FileUpload from '../components/FileUpload'

const API_URL = 'http://localhost:3001/api'

function DocumentosPage() {
    const [currentView, setCurrentView] = useState('menu') // 'menu', 'documentos', 'dados'
    const [openAccordion, setOpenAccordion] = useState(null)
    const [allFiles, setAllFiles] = useState({
        parecerJudiciario: [],
        parecerTecnico: [],
        leiAutorizadora: [],
        certificadoTribunalContas: []
    })
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Fetch persisted files from server on mount
    useEffect(() => {
        fetchPersistedFiles()
    }, [])

    const fetchPersistedFiles = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`${API_URL}/files`)

            if (!response.ok) {
                throw new Error('Erro ao buscar arquivos')
            }

            const result = await response.json()

            // Group files by category
            const groupedFiles = {
                parecerJudiciario: [],
                parecerTecnico: [],
                leiAutorizadora: [],
                certificadoTribunalContas: []
            }

            result.data.forEach(file => {
                if (groupedFiles[file.category]) {
                    groupedFiles[file.category].push({
                        ...file,
                        name: file.fileName,
                        type: getFileType(file.fileName)
                    })
                }
            })

            setAllFiles(groupedFiles)
        } catch (error) {
            console.error('Erro ao buscar arquivos:', error)
            // Server might not be running, that's ok
        } finally {
            setIsLoading(false)
        }
    }

    const getFileType = (fileName) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        const typeMap = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        return typeMap[ext] || 'application/octet-stream'
    }

    const toggleAccordion = (id) => {
        setOpenAccordion(openAccordion === id ? null : id)
    }

    const handleFilesChange = (category, files) => {
        setAllFiles(prev => ({
            ...prev,
            [category]: files
        }))
        setIsSubmitted(false)
    }

    const handleSubmit = () => {
        const totalFiles = Object.values(allFiles).flat()
        if (totalFiles.length > 0) {
            console.log('Documentos enviados:', allFiles)
            setIsSubmitted(true)
        }
    }

    const getTotalFiles = () => {
        return Object.values(allFiles).flat().length
    }

    const accordions = [
        {
            id: 'parecerJudiciario',
            title: 'Parecer Judiciário',
            icon: 'fa-gavel',
            description: 'Documentos de pareceres judiciais relacionados ao projeto'
        },
        {
            id: 'parecerTecnico',
            title: 'Parecer Técnico',
            icon: 'fa-clipboard-check',
            description: 'Documentos de pareceres técnicos e análises'
        },
        {
            id: 'leiAutorizadora',
            title: 'Lei Autorizadora',
            icon: 'fa-file-alt',
            description: 'Documentos da Lei Autorizadora do projeto'
        },
        {
            id: 'certificadoTribunalContas',
            title: 'Certificado Tribunal de Contas',
            icon: 'fa-certificate',
            description: 'Certificados emitidos pelo Tribunal de Contas'
        }
    ]

    // Dados internos simulados (serão hidratados via API posteriormente)
    const dadosInternos = [
        { id: 1, label: 'Resolução Confiex', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 2, label: 'Declaração competência tributária', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 3, label: 'Consulta taxa de câmbio banco central', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 4, label: 'Quadros de despesa com pessoal', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 5, label: 'RGF E RREO exercício anterior', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 6, label: 'RGF e RREO exercício em curso', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 7, label: 'SCE-Crédito', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 8, label: 'CDP demonstrativo', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 9, label: 'Anexo XII RREO', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 10, label: 'Consulta de violação de acordos de refinanciamento com a união', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 11, label: 'CDP Consulta de situação', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 12, label: 'Histórico do Siconfi', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 13, label: 'CAUC', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 14, label: 'Certidão de CAPAG', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 15, label: 'Parecer de deferimento STN', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 16, label: 'Ofício circular de deferimento STN', valor: 'Aguardando carregamento...', status: 'pendente' },
    ]

    // Renderiza a tela inicial com os dois botões principais
    const renderMenu = () => (
        <div className="upload-card">
            <h1>
                <i className="fas fa-folder-open mr-2" aria-hidden="true"></i>
                Gerenciamento de Documentos
            </h1>
            <p className="page-description">
                Selecione uma das opções abaixo para continuar.
            </p>

            <div className="menu-buttons">
                <button
                    className="menu-button"
                    onClick={() => setCurrentView('documentos')}
                >
                    <div className="menu-button-icon">
                        <i className="fas fa-file-upload" aria-hidden="true"></i>
                    </div>
                    <div className="menu-button-content">
                        <h3>Anexar documentos necessários</h3>
                        <p>Anexe documentos por categoria: Parecer Judiciário, Parecer Técnico, Lei Autorizadora e Certificado Tribunal de Contas</p>
                    </div>
                    <i className="fas fa-chevron-right menu-button-arrow" aria-hidden="true"></i>
                </button>

                <button
                    className="menu-button"
                    onClick={() => setCurrentView('dados')}
                >
                    <div className="menu-button-icon">
                        <i className="fas fa-database" aria-hidden="true"></i>
                    </div>
                    <div className="menu-button-content">
                        <h3>Dados internos processados</h3>
                        <p>Visualize os dados processados obtidos das bases do Gov.br para continuidade do processo.</p>
                    </div>
                    <i className="fas fa-chevron-right menu-button-arrow" aria-hidden="true"></i>
                </button>
            </div>
        </div>
    )

    // Renderiza a tela de upload de documentos (categorias)
    const renderDocumentos = () => (
        <div className="upload-card">
            <h1>
                <i className="fas fa-file-upload mr-2" aria-hidden="true"></i>
                Anexar Documentos por Categoria
            </h1>
            <p className="page-description">
                Selecione a categoria e anexe os documentos correspondentes.
                {isLoading && <span className="loading-text"> Carregando arquivos salvos...</span>}
            </p>

            {/* Acordeões */}
            <div className="accordions-container">
                {accordions.map((accordion) => (
                    <div key={accordion.id} className="br-accordion">
                        <div className="accordion-item">
                            <button
                                className={`accordion-header ${openAccordion === accordion.id ? 'active' : ''}`}
                                type="button"
                                onClick={() => toggleAccordion(accordion.id)}
                                aria-expanded={openAccordion === accordion.id}
                                aria-controls={`content-${accordion.id}`}
                            >
                                <span className="accordion-title">
                                    <i className={`fas ${accordion.icon} mr-2`} aria-hidden="true"></i>
                                    {accordion.title}
                                    {allFiles[accordion.id].length > 0 && (
                                        <span className="file-badge">
                                            {allFiles[accordion.id].length}
                                        </span>
                                    )}
                                </span>
                                <i className={`fas fa-chevron-${openAccordion === accordion.id ? 'up' : 'down'}`} aria-hidden="true"></i>
                            </button>
                            <div
                                id={`content-${accordion.id}`}
                                className={`accordion-content ${openAccordion === accordion.id ? 'show' : ''}`}
                            >
                                <p className="accordion-description">{accordion.description}</p>
                                <FileUpload
                                    id={accordion.id}
                                    onFilesChange={handleFilesChange}
                                    initialFiles={allFiles[accordion.id]}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mensagem de Sucesso */}
            {isSubmitted && (
                <div className="success-message" role="alert">
                    <i className="fas fa-check-circle" aria-hidden="true"></i>
                    <span><strong>Sucesso!</strong> Seus documentos foram enviados com êxito.</span>
                </div>
            )}

            {/* Botões de Ação */}
            <div className="button-group">
                <button
                    className="br-button secondary"
                    onClick={() => setCurrentView('menu')}
                >
                    <i className="fas fa-arrow-left mr-1" aria-hidden="true"></i>
                    Voltar
                </button>
                <button
                    className="br-button primary"
                    type="button"
                    onClick={handleSubmit}
                    disabled={getTotalFiles() === 0}
                >
                    <i className="fas fa-paper-plane mr-1" aria-hidden="true"></i>
                    Enviar Documentos ({getTotalFiles()})
                </button>
            </div>
        </div>
    )

    // Renderiza a tela de dados internos
    const renderDadosInternos = () => (
        <div className="upload-card">
            <h1>
                <i className="fas fa-database mr-2" aria-hidden="true"></i>
                Análise de Dados Internos
            </h1>
            <p className="page-description">
                Dados obtidos via integração com as bases do Gov.br. Estas informações são atualizadas automaticamente.
            </p>

            {/* Lista de dados internos */}
            <div className="dados-internos-container">
                {dadosInternos.map((dado) => (
                    <div key={dado.id} className="dado-item">
                        <div className="dado-info">
                            <span className="dado-label">{dado.label}</span>
                            <span className="dado-valor">{dado.valor}</span>
                        </div>
                        <div className="dado-status">
                            <span className={`status-badge ${dado.status}`}>
                                <i className={`fas ${dado.status === 'pendente' ? 'fa-clock' : 'fa-check-circle'}`} aria-hidden="true"></i>
                                {dado.status === 'pendente' ? 'Pendente' : 'Atualizado'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botão de atualização */}
            <div className="dados-actions">
                <button className="br-button secondary" disabled>
                    <i className="fas fa-sync-alt mr-1" aria-hidden="true"></i>
                    Atualizar Dados
                </button>
            </div>

            {/* Botões de Ação */}
            <div className="button-group">
                <button
                    className="br-button secondary"
                    onClick={() => setCurrentView('menu')}
                >
                    <i className="fas fa-arrow-left mr-1" aria-hidden="true"></i>
                    Voltar
                </button>
            </div>
        </div>
    )

    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <header className="br-header">
                <div className="container-fluid">
                    <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                        <h1 className="header-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1351b4' }}>Sistema PVLC</h1>
                        <div className="header-actions">
                            <button className="br-button circle" type="button" aria-label="Área do usuário">
                                <i className="fas fa-user" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Conteúdo Principal */}
            <main className="main-content d-flex flex-fill" id="main">
                <div className="container-fluid">

                    {/* Card Principal */}
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-10 col-lg-8">
                            {currentView === 'menu' && renderMenu()}
                            {currentView === 'documentos' && renderDocumentos()}
                            {currentView === 'dados' && renderDadosInternos()}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Padrão Governo */}
            <footer className="br-footer mt-auto">
                <div className="container-fluid">
                    <div className="info">
                        <div className="text-center" style={{ padding: '1.5rem' }}>
                            <img
                                src="https://www.gov.br/++theme++padrao_govbr/img/govbr-logo-large.png"
                                alt="Governo Federal"
                                style={{ height: '48px', marginBottom: '1rem' }}
                            />
                            <p className="text-gray-60" style={{ margin: 0 }}>
                                Todo o conteúdo deste site está publicado sob a licença Creative Commons Atribuição-SemDerivações 3.0
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default DocumentosPage
