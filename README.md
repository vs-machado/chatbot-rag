# Chatbot with RAG

A chatbot application with Retrieval-Augmented Generation (RAG) capabilities.

## Tech Stack

### Frontend
- **React** - Frontend UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **FastAPI** - Backend API framework
- **PostgreSQL** - Database with pgvector extension
- **Sentence Transformers** - Local embedding generation
- **SQLAlchemy + Alembic** - ORM and migrations
- **Docker** - Containerization

## Project Structure

```
chatbot-rag/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── backend/           # FastAPI backend
│   ├── alembic/       # Database migrations
│   ├── services/      # Business logic services
│   ├── main.py
│   ├── config.py      # Centralized configuration
│   ├── database.py    # SQLAlchemy setup
│   ├── models.py      # Database models
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml          # Base (development)
├── docker-compose.test.yml     # Test overrides
├── docker-compose.prod.yml     # Production overrides
├── AGENTS.md                   # Guidelines for AI agents
└── README.md
```

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.12+
- Docker and Docker Compose

### Quick Start with Docker (Recommended)

```bash
# Copia o arquivo de ambiente
cp .env.example .env

# Inicia todos os serviços (desenvolvimento)
docker-compose up

# Ou em modo detached
docker-compose up -d
```

**Serviços disponíveis:**
| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:5173 | React + Vite (hot-reload) |
| Backend | http://localhost:8000 | FastAPI + uvicorn |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Database | localhost:5432 | PostgreSQL + pgvector |

### Docker Compose Commands

```bash
# Desenvolvimento (padrão)
docker-compose up

# Testes (banco isolado na porta 5433)
docker-compose -f docker-compose.yml -f docker-compose.test.yml up

# Produção (nginx + uvicorn otimizado)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild após mudanças no Dockerfile
docker-compose up --build

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (limpa o banco)
docker-compose down -v

# Ver logs de um serviço específico
docker-compose logs -f backend
```

### Database Migrations

```bash
# Executar migrations (dentro do container)
docker-compose exec backend alembic upgrade head

# Criar nova migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Reverter última migration
docker-compose exec backend alembic downgrade -1
```

### Manual Setup (without Docker)

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### Backend

```bash
cd backend

# Cria ambiente virtual
python -m venv venv

# Ativa o ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instala as dependências
pip install -r requirements.txt

# Configura variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Executa migrations
alembic upgrade head

# Executa o servidor
python main.py
```

The backend API will be available at `http://localhost:8000`

API Documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | chatbot | PostgreSQL username |
| `POSTGRES_PASSWORD` | chatbot123 | PostgreSQL password |
| `POSTGRES_DB` | chatbot_rag | Database name |
| `EMBEDDING_MODEL` | all-MiniLM-L6-v2 | Sentence Transformers model |

## Development

See `AGENTS.md` for detailed coding guidelines and best practices.
