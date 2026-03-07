<p align="center">
  <img width="120" alt="Chatbot icon" src="https://github.com/user-attachments/assets/bf148d38-a0d3-4dd6-835a-e1d3755646af" />
</p>

<h1 align="center">Chatbot with RAG</h1>


<p align="center">
  A chatbot application with Retrieval-Augmented Generation (RAG) capabilities.
</p>

<p align="center">
  <img width="100%" alt="Chat interface screenshot" src="https://github.com/user-attachments/assets/fa79630a-ee79-4009-a4e9-a2e7dd7aa0fb" />

  <img width="100%" alt="Document upload and knowledge base screenshot" src="https://github.com/user-attachments/assets/e2b0d3fb-c026-4f67-ac9a-e41891cac08c" />

</p>

## Overview

This project combines a React frontend and a FastAPI backend to let users upload documents, search relevant context, and chat with an LLM grounded by the knowledge base.

## How to Use

1. Start the application and open the chat interface.
2. Attach one or more documents before asking questions.
3. Choose whether the files should be used only in the current chat or saved to the knowledge base.
4. Wait for the upload and processing to finish.
5. Ask questions about the uploaded content and the assistant will answer based on the retrieved context.

Important: the chatbot works best when documents are added first. If no relevant document is available, the answer may fall back to the model's general knowledge.

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

## Supported Chat Models

The chatbot currently supports the following models:

- `Gemini 2.5 Flash` via Google (`gemini-2.5-flash`)
- `Trinity Large (Free)` via OpenRouter (`arcee-ai/trinity-large-preview:free`)
- `Trinity Mini (Free)` via OpenRouter (`arcee-ai/trinity-mini:free`)
- `GPT OSS 120B (Free)` via OpenRouter (`openai/gpt-oss-120b:free`)

Important: to run the chat features, you must obtain and configure at least one provider API key:

- `GOOGLE_API_KEY` for Gemini models
- `OPENROUTER_API_KEY` for OpenRouter models

Without one of these keys configured in `backend/.env`, the application can start, but chat requests will fail when trying to use an LLM.

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.12+
- Docker and Docker Compose

### Quick Start with Docker (Recommended)

```bash
# Copy the environment file
cp .env.example .env

# Copy the backend environment file and configure your API key
cp backend/.env.example backend/.env

# Start all services (development)
docker-compose up

# Or run in detached mode
docker-compose up -d
```

**Available services:**
| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React + Vite (hot-reload) |
| Backend | http://localhost:8000 | FastAPI + uvicorn |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Database | localhost:5432 | PostgreSQL + pgvector |

### Docker Compose Commands

```bash
# Development (default)
docker-compose up

# Tests (isolated database on port 5433)
docker-compose -f docker-compose.yml -f docker-compose.test.yml up

# Production (nginx + optimized uvicorn)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Rebuild after Dockerfile changes
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (clears the database)
docker-compose down -v

# View logs for a specific service
docker-compose logs -f backend
```

### Database Migrations

```bash
# Run migrations (inside the container)
docker-compose exec backend alembic upgrade head

# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Revert the last migration
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

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit `.env` with your settings

# Run migrations
alembic upgrade head

# Start the server
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

For LLM execution, also configure `backend/.env` with:

- `GOOGLE_API_KEY` to use Gemini
- `OPENROUTER_API_KEY` to use OpenRouter models
- `LLM_PROVIDER` and `LLM_MODEL` to define the default chat model

## Development

See `AGENTS.md` for detailed coding guidelines and best practices.

### Git Hooks

To install the local Git hooks in your clone, run:

```bash
node scripts/install-hooks.mjs
```

This command copies `.githooks/pre-commit` to `.git/hooks/pre-commit` on your machine.

After installation, every `git commit` runs the pre-commit hook automatically. Right now it executes the frontend end-to-end suite with:

```bash
npm run test:e2e
```

If the test fails, the commit is blocked.
