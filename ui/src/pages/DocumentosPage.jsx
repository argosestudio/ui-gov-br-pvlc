import { useState, useEffect } from 'react'
import { Layout, BackButton } from '../components/Layout'
import FileUpload from '../components/FileUpload'

const API_URL = 'http://localhost:3001/api'

function DocumentosPage() {
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

    return (
        <Layout>
            <div className="upload-card">
                {/* Header com título e botão voltar */}
                <div className="page-header">
                    <h1>
                        <i className="fas fa-file-upload mr-2" aria-hidden="true"></i>
                        Anexar Documentos por Categoria
                    </h1>
                    <BackButton toMenu />
                </div>
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
                    <BackButton toMenu />
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
        </Layout>
    )
}

export default DocumentosPage
