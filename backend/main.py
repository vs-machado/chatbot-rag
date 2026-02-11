from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import Base, engine
from routers import documents


# Lifespan para inicialização e cleanup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação.

    Inicializa o banco de dados e cria tabelas na startup.
    """
    # Inicialização: cria tabelas se não existirem
    # Habilita extensão pgvector e cria tabelas
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    print("Tabelas criadas/verificadas com sucesso")
    yield
    # Cleanup (se necessário)
    pass


app = FastAPI(title="Chatbot RAG API", version="0.1.0", lifespan=lifespan)

# Configuração de CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui os roteadores
app.include_router(documents.router)


@app.get("/")
def read_root():
    """Endpoint raiz da API.

    Retorna mensagem de status da API.
    """
    return {"message": "API do Chatbot RAG está funcionando", "status": "online"}


@app.get("/health")
def health_check():
    """Endpoint de health check.

    Retorna o status de saúde da API.
    """
    return {"status": "healthy"}


@app.get("/api/v1/chat")
def get_chat():
    """Endpoint de chat.

    Retorna mensagem indicando que o endpoint está em desenvolvimento.
    """
    return {"message": "Endpoint de chat em desenvolvimento"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
