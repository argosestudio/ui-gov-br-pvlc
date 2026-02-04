import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'

// Definição das etapas do projeto
const ETAPAS_PROJETO = [
    { id: 'cofiex', label: 'Aprovação do COFIEX' },
    { id: 'negociacao', label: 'Negociação do contrato' },
    { id: 'pvl', label: 'Análise do PVLC' },
    { id: 'senado', label: 'Análise no Senado' },
    { id: 'assinatura', label: 'Assinatura do contrato' }
]

// Etapas que NÃO permitem anexar documentos
const ETAPAS_SEM_ANEXO = ['cofiex', 'negociacao']

function MenuPage() {
    const navigate = useNavigate()

    // Etapa atual do projeto (hardcoded para exemplo - pode ser 'cofiex', 'negociacao', 'pvl', etc.)
    const [etapaAtual] = useState('pvl') // Altere aqui para testar diferentes etapas
    // const [etapaAtual] = useState('cofiex') // Altere aqui para testar diferentes etapas


    // Verifica se pode anexar documentos na etapa atual
    const podeAnexarDocumentos = !ETAPAS_SEM_ANEXO.includes(etapaAtual)

    // Encontra o índice da etapa atual
    const etapaAtualIndex = ETAPAS_PROJETO.findIndex(e => e.id === etapaAtual)
    const etapaAtualLabel = ETAPAS_PROJETO.find(e => e.id === etapaAtual)?.label || ''

    return (
        <Layout>
            {/* Componente de Etapa do Projeto */}
            <div className="etapa-projeto-card">
                <div className="etapa-projeto-header">
                    <i className="fas fa-tasks" aria-hidden="true"></i>
                    <span>Etapa do Projeto:</span>
                    <strong className="etapa-atual-label">{etapaAtualLabel}</strong>
                </div>
                <div className="etapa-projeto-timeline">
                    {ETAPAS_PROJETO.map((etapa, index) => {
                        const isCompleted = index < etapaAtualIndex
                        const isCurrent = index === etapaAtualIndex
                        return (
                            <div
                                key={etapa.id}
                                className={`etapa-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                            >
                                <div className="etapa-step-circle">
                                    {isCompleted ? (
                                        <i className="fas fa-check" aria-hidden="true"></i>
                                    ) : (
                                        <span>{index + 1}</span>
                                    )}
                                </div>
                                <span className="etapa-step-label">{etapa.label}</span>
                                {index < ETAPAS_PROJETO.length - 1 && <div className="etapa-step-line"></div>}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="upload-card">
                <h1>
                    <i className="fas fa-folder-open mr-2" aria-hidden="true"></i>
                    Gerenciamento de Documentos
                </h1>
                <p className="page-description">
                    Selecione uma das opções abaixo para continuar.
                </p>

                <div className="menu-buttons">
                    {/* 1. Informações gerais do projeto */}
                    <button
                        className="menu-button"
                        onClick={() => navigate('/dados-projetos')}
                    >
                        <div className="menu-button-icon">
                            <i className="fas fa-info-circle" aria-hidden="true"></i>
                        </div>
                        <div className="menu-button-content">
                            <h3>Informações gerais referentes ao projeto</h3>
                            <p>Visualize e edite as informações gerais do projeto: nome, descrição, objetivo, justificativa e localização</p>
                        </div>
                        <i className="fas fa-chevron-right menu-button-arrow" aria-hidden="true"></i>
                    </button>

                    {/* 2. Dados internos processados */}
                    <button
                        className="menu-button"
                        onClick={() => navigate('/dados-internos')}
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

                    {/* 3. Anexar documentos */}
                    <div className="menu-button-wrapper" title={!podeAnexarDocumentos ? 'Você poderá anexar os seus documentos quando estiver na etapa de PVLC' : ''}>
                        <button
                            className={`menu-button ${!podeAnexarDocumentos ? 'disabled' : ''}`}
                            onClick={() => podeAnexarDocumentos && navigate('/docs-necessarios')}
                            disabled={!podeAnexarDocumentos}
                        >
                            <div className="menu-button-icon">
                                <i className="fas fa-file-upload" aria-hidden="true"></i>
                            </div>
                            <div className="menu-button-content">
                                <h3>Anexar documentos necessários</h3>
                                <p>Anexe documentos por categoria: Parecer Judiciário, Parecer Técnico, Lei Autorizadora e Certificado Tribunal de Contas</p>
                                {!podeAnexarDocumentos && (
                                    <span className="menu-button-aviso">
                                        <i className="fas fa-lock mr-1" aria-hidden="true"></i>
                                        Disponível a partir da etapa de Análise do PVL
                                    </span>
                                )}
                            </div>
                            <i className="fas fa-chevron-right menu-button-arrow" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default MenuPage
