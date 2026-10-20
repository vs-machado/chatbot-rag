import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from config import CORS_ALLOWED_ORIGINS
from database import Base, engine
from routers import chat, documents
from services.local_embeddings import local_embeddings

# Configuração de logging para mostrar logs em tempo real no Docker
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# Lifespan para inicialização e cleanup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação.

    Inicializa o banco sem carregar modelos e encerra inferência local na saída.
    """
    # Inicialização: cria tabelas se não existirem
    # Habilita extensão pgvector e cria tabelas
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    logger.info("Tabelas criadas/verificadas com sucesso")

    try:
        yield
    finally:
        await asyncio.to_thread(local_embeddings.close)


app = FastAPI(title="Chatbot RAG API", version="0.1.0", lifespan=lifespan)

# Configuração de CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclui os roteadores
app.include_router(documents.router)
app.include_router(chat.router)


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
