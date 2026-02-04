import { useState, useEffect } from 'react'
import { Layout, BackButton } from '../components/Layout'

const API_URL = 'http://localhost:3001/api'

function DadosInternosPage() {
    // PTAX exchange rate state
    const [ptaxData, setPtaxData] = useState(null)
    const [ptaxLoading, setPtaxLoading] = useState(false)
    const [ptaxError, setPtaxError] = useState(null)

    // Fetch PTAX on mount
    useEffect(() => {
        fetchPTAXRate()
    }, [])

    const fetchPTAXRate = async () => {
        try {
            setPtaxLoading(true)
            setPtaxError(null)

            const response = await fetch(`${API_URL}/ptax`)
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Erro ao buscar taxa PTAX')
            }

            setPtaxData(result.data)
        } catch (error) {
            console.error('Erro ao buscar PTAX:', error)
            setPtaxError(error.message)
        } finally {
            setPtaxLoading(false)
        }
    }

    // Helper function to get PTAX display value
    const getPTAXValue = () => {
        if (ptaxLoading) return 'Carregando...'
        if (ptaxError) return 'Erro ao carregar'
        if (ptaxData) return `R$ ${ptaxData.cotacaoVenda.toFixed(4)}`
        return 'Aguardando carregamento...'
    }

    const getPTAXStatus = () => {
        if (ptaxLoading) return 'pendente'
        if (ptaxError) return 'erro'
        if (ptaxData) return 'atualizado'
        return 'pendente'
    }

    // Dados internos
    const dadosInternos = [
        { id: 1, label: 'Resolução Confiex', valor: 'Aguardando carregamento...', status: 'pendente' },
        { id: 2, label: 'Declaração competência tributária', valor: 'Aguardando carregamento...', status: 'pendente' },
        {
            id: 3,
            label: 'Consulta taxa de câmbio banco central',
            valor: getPTAXValue(),
            status: getPTAXStatus(),
            extra: ptaxData ? {
                dataCotacao: ptaxData.dataCotacao,
                bimestre: ptaxData.bimestre,
                fonte: ptaxData.fonte,
                cached: ptaxData.cached
            } : null
        },
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

    return (
        <Layout>
            <div className="upload-card">
                {/* Header com título e botão voltar */}
                <div className="page-header">
                    <h1>
                        <i className="fas fa-database mr-2" aria-hidden="true"></i>
                        Análise de Dados Internos
                    </h1>
                    <BackButton toMenu />
                </div>
                <p className="page-description">
                    Dados obtidos via integração com as bases do Gov.br. Estas informações são atualizadas automaticamente.
                </p>

                {/* Lista de dados internos */}
                <div className="dados-internos-container">
                    {dadosInternos.map((dado) => (
                        <div key={dado.id} className={`dado-item ${dado.status === 'atualizado' ? 'dado-item-success' : ''}`}>
                            <div className="dado-info">
                                <span className="dado-label">{dado.label}</span>
                                <span className={`dado-valor ${dado.status === 'atualizado' ? 'dado-valor-highlight' : ''}`}>
                                    {dado.valor}
                                </span>
                                {dado.extra && (
                                    <span className="dado-extra">
                                        Cotação de {dado.extra.dataCotacao} • {dado.extra.fonte}
                                        {dado.extra.cached && ' (cache)'}
                                    </span>
                                )}
                            </div>
                            <div className="dado-status">
                                <span className={`status-badge ${dado.status}`}>
                                    <i className={`fas ${dado.status === 'pendente' ? 'fa-clock' :
                                        dado.status === 'erro' ? 'fa-exclamation-circle' :
                                            'fa-check-circle'
                                        }`} aria-hidden="true"></i>
                                    {dado.status === 'pendente' ? 'Pendente' :
                                        dado.status === 'erro' ? 'Erro' :
                                            'Atualizado'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mensagem de erro PTAX */}
                {ptaxError && (
                    <div className="error-message" role="alert">
                        <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                        <span><strong>Erro PTAX:</strong> {ptaxError}</span>
                        <button
                            className="br-button secondary small"
                            onClick={fetchPTAXRate}
                            disabled={ptaxLoading}
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* Botão de atualização */}
                <div className="dados-actions">
                    <button
                        className="br-button secondary"
                        onClick={fetchPTAXRate}
                        disabled={ptaxLoading}
                    >
                        <i className={`fas ${ptaxLoading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-1`} aria-hidden="true"></i>
                        {ptaxLoading ? 'Atualizando...' : 'Atualizar Dados'}
                    </button>
                </div>

                {/* Botões de Ação no final */}
                <div className="button-group">
                    <BackButton toMenu />
                </div>
            </div>
        </Layout>
    )
}

export default DadosInternosPage
