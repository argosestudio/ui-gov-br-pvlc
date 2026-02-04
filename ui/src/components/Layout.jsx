import { useNavigate } from 'react-router-dom'

function Layout({ children }) {
    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <header className="br-header">
                <div className="container-fluid">
                    <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
                        <h1 className="header-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1351b4' }}>Sistema CREDEX</h1>
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
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-10 col-lg-8">
                            {children}
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

/**
 * Back button component - Botão de voltar reutilizável
 */
function BackButton({ toMenu = false }) {
    const navigate = useNavigate()

    const handleBack = () => {
        if (toMenu) {
            navigate('/')
        } else {
            navigate(-1)
        }
    }

    return (
        <button
            className="br-button secondary"
            onClick={handleBack}
        >
            <i className="fas fa-arrow-left mr-1" aria-hidden="true"></i>
            Voltar
        </button>
    )
}

export { Layout, BackButton }
