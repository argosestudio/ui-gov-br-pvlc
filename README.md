# Sistema PVLC - Gerenciamento de Documentos

Sistema para gerenciamento de documentos do PVLC (Programa de Verificação de Limites e Condições) com persistência em bucket storage.

## 🏗️ Estrutura do Projeto

```
test-ui-gov/
├── ui/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   └── pages/        # Páginas da aplicação
│   └── package.json
├── backend/              # Backend Express.js
│   ├── adapters/         # Adapters de storage (MinIO/S3)
│   └── package.json
├── docker-compose.yml    # MinIO (bucket storage)
├── Makefile              # Comandos de desenvolvimento
└── README.md
```

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose

### Instalação

```bash
# Instalar todas as dependências
make install
```

### Desenvolvimento

```bash
# Iniciar todos os serviços (Frontend + Backend + MinIO)
make all

# Ou iniciar serviços individualmente:
make dev-ui        # Apenas frontend (http://localhost:5173)
make dev-backend   # Apenas backend (http://localhost:3001)
make docker-up     # Apenas MinIO (http://localhost:9001)
```

### Comandos Disponíveis

| Comando            | Descrição                              |
|--------------------|----------------------------------------|
| `make help`        | Lista todos os comandos disponíveis    |
| `make install`     | Instala dependências (UI + Backend)    |
| `make dev-ui`      | Inicia apenas o frontend               |
| `make dev-backend` | Inicia apenas o backend                |
| `make docker-up`   | Inicia MinIO (Docker)                  |
| `make docker-down` | Para MinIO (Docker)                    |
| `make dev`         | Inicia Backend + MinIO                 |
| `make all`         | Inicia todos os serviços               |
| `make clean`       | Remove node_modules e volumes Docker   |

## 📦 API Endpoints

| Método   | Endpoint                          | Descrição                    |
|----------|-----------------------------------|------------------------------|
| `POST`   | `/api/files`                      | Upload de arquivo            |
| `GET`    | `/api/files`                      | Lista todos os arquivos      |
| `GET`    | `/api/files?category=<cat>`       | Lista arquivos por categoria |
| `GET`    | `/api/files/:category/:folderId`  | Download de arquivo          |
| `DELETE` | `/api/files/:category/:folderId`  | Remove arquivo               |
| `GET`    | `/api/health`                     | Health check                 |

## 🗄️ Storage

O sistema utiliza MinIO como bucket storage local, compatível com AWS S3. A arquitetura utiliza o padrão Adapter, permitindo fácil migração para S3 ou outros serviços de cloud storage.

### Acessar Console do MinIO

- URL: http://localhost:9001
- Usuário: `minioadmin`
- Senha: `minioadmin`

### Estrutura de Armazenamento

```
documents/                        # Bucket
├── parecerJudiciario/           # Categoria
│   └── {uuid}/                  # Pasta única por arquivo
│       └── documento.pdf
├── parecerTecnico/
│   └── {uuid}/
│       └── parecer.docx
└── ...
```

## 🛠️ Tecnologias

### Frontend
- React 19
- Vite 7
- GovBR Design System

### Backend
- Express.js
- MinIO SDK
- Multer (upload de arquivos)

### Infraestrutura
- Docker + Docker Compose
- MinIO (S3-compatible storage)
