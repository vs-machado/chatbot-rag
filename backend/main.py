from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import documents
from database import engine, Base
import models  # Importa para registrar os modelos

# Lifespan para inicialização e cleanup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialização: cria tabelas se não existirem
    # Habilita extensão pgvector e cria tabelas
    from sqlalchemy import text
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
    return {"message": "API do Chatbot RAG está funcionando", "status": "online"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/v1/chat")
def get_chat():
    return {"message": "Endpoint de chat em desenvolvimento"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
