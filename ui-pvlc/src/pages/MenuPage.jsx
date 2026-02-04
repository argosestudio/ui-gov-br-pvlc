import { useNavigate } from 'react-router-dom'
import { Layout, Timeline } from '../components/Layout'

function MenuPage() {
    const navigate = useNavigate()

    return (
        <Layout>
            <div className="upload-card">
                {/* Timeline do processo */}
                <Timeline />

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
                    <button
                        className="menu-button"
                        onClick={() => navigate('/docs-necessarios')}
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
                </div>
            </div>
        </Layout>
    )
}

export default MenuPage
