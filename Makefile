.PHONY: help install install-ui install-backend dev dev-ui dev-backend docker-up docker-down all clean

# Default target
help:
	@echo "Sistema PVLC - Comandos disponíveis:"
	@echo ""
	@echo "  make install         - Instala dependências (UI + Backend)"
	@echo "  make install-ui      - Instala dependências do frontend"
	@echo "  make install-backend - Instala dependências do backend"
	@echo ""
	@echo "  make dev-ui          - Inicia apenas o frontend"
	@echo "  make dev-backend     - Inicia apenas o backend"
	@echo "  make docker-up       - Inicia apenas o MinIO (Docker)"
	@echo "  make docker-down     - Para o MinIO (Docker)"
	@echo ""
	@echo "  make dev             - Inicia backend + MinIO"
	@echo "  make all             - Inicia todos os serviços (UI + Backend + MinIO)"
	@echo ""
	@echo "  make clean           - Remove node_modules e volumes Docker"

# Install dependencies
install: install-ui install-backend

install-ui:
	@echo "📦 Instalando dependências do frontend..."
	cd ui && npm install

install-backend:
	@echo "📦 Instalando dependências do backend..."
	cd backend && npm install

# Development - Individual services
dev-ui:
	@echo "🚀 Iniciando frontend..."
	cd ui && npm run dev

dev-backend:
	@echo "🚀 Iniciando backend..."
	cd backend && npm run dev

docker-up:
	@echo "🐳 Iniciando MinIO..."
	docker-compose up -d

docker-down:
	@echo "🛑 Parando MinIO..."
	docker-compose down

# Development - Combined
dev: docker-up
	@echo "🚀 Iniciando backend + MinIO..."
	@sleep 3
	cd backend && npm run dev

# All services (runs in background with logs)
all: docker-up
	@echo "🚀 Iniciando todos os serviços..."
	@sleep 3
	@echo "Iniciando backend em background..."
	@cd backend && npm run dev &
	@echo "Iniciando frontend..."
	cd ui && npm run dev

# Cleanup
clean:
	@echo "🧹 Limpando projeto..."
	rm -rf ui/node_modules
	rm -rf backend/node_modules
	docker-compose down -v
	@echo "✅ Limpeza concluída"
