import { useState } from 'react'
import { Layout, BackButton } from '../components/Layout'

function ProjetoPage() {
    // Project info state (mock data - will be fetched from API later)
    const [projectInfo] = useState({
        nome: 'Projeto de Infraestrutura Urbana',
        descricao: 'Desenvolvimento de infraestrutura urbana sustentável para a região metropolitana',
        objetivo: 'Melhorar a qualidade de vida da população através de obras de infraestrutura',
        justificativa: 'Necessidade de modernização da infraestrutura urbana para atender demandas crescentes',
        localizacao: 'São Paulo - SP',
        periodoExecucao: 'Janeiro 2026 - Dezembro 2028',
        cronogramaFinanceiro: [
            { ano: '2026', valor: 'R$ 15.000.000,00', descricao: 'Fase inicial: estudos e projetos executivos' },
            { ano: '2027', valor: 'R$ 45.000.000,00', descricao: 'Fase de execução: obras civis' },
            { ano: '2028', valor: 'R$ 25.000.000,00', descricao: 'Fase final: acabamentos e entrega' }
        ],
        valorTotal: 'R$ 85.000.000,00',
        links: [
            { label: 'Portal do Projeto', url: 'https://exemplo.gov.br/projeto' },
            { label: 'Documentação Técnica', url: 'https://exemplo.gov.br/docs' }
        ]
    })

    return (
        <Layout>
            <div className="upload-card">
                {/* Header com título e botão voltar */}
                <div className="page-header">
                    <h1>
                        <i className="fas fa-info-circle mr-2" aria-hidden="true"></i>
                        Informações Gerais do Projeto
                    </h1>
                    <BackButton toMenu />
                </div>
                <p className="page-description">
                    Informações cadastradas sobre o projeto. Estas informações serão utilizadas na análise do PVL.
                </p>

                <div className="projeto-info-container">
                    <div className="projeto-info-item">
                        <label>Nome do Projeto</label>
                        <p>{projectInfo.nome}</p>
                    </div>

                    <div className="projeto-info-item">
                        <label>Descrição do Projeto</label>
                        <p>{projectInfo.descricao}</p>
                    </div>

                    <div className="projeto-info-item">
                        <label>Objetivo do Projeto</label>
                        <p>{projectInfo.objetivo}</p>
                    </div>

                    <div className="projeto-info-item">
                        <label>Justificativa do Projeto</label>
                        <p>{projectInfo.justificativa}</p>
                    </div>

                    <div className="projeto-info-row">
                        <div className="projeto-info-item">
                            <label>Localização do Projeto</label>
                            <p>{projectInfo.localizacao}</p>
                        </div>
                        <div className="projeto-info-item">
                            <label>Período de Execução</label>
                            <p>{projectInfo.periodoExecucao}</p>
                        </div>
                    </div>

                    <div className="projeto-info-item">
                        <label>Links Relacionados ao Projeto</label>
                        <div className="projeto-links">
                            {projectInfo.links.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="projeto-link"
                                >
                                    <i className="fas fa-external-link-alt mr-1" aria-hidden="true"></i>
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Cronograma Financeiro */}
                    <div className="projeto-info-item cronograma-section">
                        <label>
                            <i className="fas fa-chart-line mr-1" aria-hidden="true"></i>
                            Cronograma Financeiro
                        </label>
                        <div className="cronograma-table">
                            <div className="cronograma-header">
                                <span className="cronograma-col-ano">Ano</span>
                                <span className="cronograma-col-valor">Valor Previsto</span>
                                <span className="cronograma-col-desc">Descrição</span>
                            </div>
                            {projectInfo.cronogramaFinanceiro.map((item, index) => (
                                <div key={index} className="cronograma-row">
                                    <span className="cronograma-col-ano">{item.ano}</span>
                                    <span className="cronograma-col-valor">{item.valor}</span>
                                    <span className="cronograma-col-desc">{item.descricao}</span>
                                </div>
                            ))}
                            <div className="cronograma-total">
                                <span className="cronograma-col-ano">Total</span>
                                <span className="cronograma-col-valor cronograma-total-valor">{projectInfo.valorTotal}</span>
                                <span className="cronograma-col-desc"></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="button-group">
                    <BackButton toMenu />
                    <button
                        className="br-button primary"
                        type="button"
                        disabled
                    >
                        <i className="fas fa-edit mr-1" aria-hidden="true"></i>
                        Editar Informações
                    </button>
                </div>
            </div>
        </Layout>
    )
}

export default ProjetoPage
