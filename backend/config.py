import os
from enum import Enum

from dotenv import load_dotenv

load_dotenv()


class EmbeddingProvider(str, Enum):
    """Provedores de embedding disponíveis."""

    SENTENCE_TRANSFORMERS = "sentence_transformers"
    GOOGLE = "google"
    OPENAI = "openai"


class LLMProvider(str, Enum):
    """Provedores de LLM disponíveis."""

    GOOGLE = "google"
    OPENAI = "openai"
    OPENROUTER = "openrouter"


# Configuração do banco de dados
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://user:password@localhost:5432/chatbot_rag"
)

# Configuração de embeddings
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", EmbeddingProvider.SENTENCE_TRANSFORMERS.value)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Dimensões por modelo de embedding
EMBEDDING_DIMENSIONS = {
    # Sentence Transformers
    "all-MiniLM-L6-v2": 384,
    "all-mpnet-base-v2": 768,
    "paraphrase-multilingual-MiniLM-L12-v2": 384,
    "Qwen/Qwen3-Embedding-0.6B": 1024,
    "Qwen/Qwen3-Embedding-4B": 2560,
    "Qwen/Qwen3-Embedding-8B": 4096,
    # Google
    "models/text-embedding-004": 768,
    "models/embedding-001": 768,
    # OpenAI
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
}

# Dimensão padrão baseada no modelo configurado
EMBEDDING_DIMENSION = int(
    os.getenv("EMBEDDING_DIMENSION", str(EMBEDDING_DIMENSIONS.get(EMBEDDING_MODEL, 384)))
)

# Configuração de LLM
LLM_PROVIDER = os.getenv("LLM_PROVIDER", LLMProvider.GOOGLE.value)
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.3"))

# API Keys (podem ser sobrescritas por requisição)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "chatbot-rag")

# Configuração de chunking para documentos
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

# Configuração padrão de recuperação no RAG
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "3"))

# Diretório para upload temporário
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/chatbot_rag_uploads")
