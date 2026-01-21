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
- **PostgreSQL** - Database (to be added)
- **PGVector** - Vector extension for PostgreSQL for embeddings storage (to be added)
- **Docker** - Containerization (to be added)

## Project Structure

```
chatbot-rag/
├── frontend/          # React + TypeScript frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # FastAPI backend
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── AGENTS.md          # Guidelines for AI agents
└── README.md
```

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.10+
- Docker and Docker Compose (optional)

### Frontend

Navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend

Navigate to the backend directory:

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

# Executa o servidor
python main.py
```

The backend API will be available at `http://localhost:8000`

API Documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

See `AGENTS.md` for detailed coding guidelines and best practices.
