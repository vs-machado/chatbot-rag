from sentence_transformers import SentenceTransformer
from typing import Union
from config import EMBEDDING_MODEL

# Instância singleton do modelo de embeddings
_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """
    Retorna a instância singleton do modelo de embeddings.
    Carrega o modelo na primeira chamada e reutiliza nas próximas.
    """
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def generate_embedding(text: str) -> list[float]:
    """
    Gera um vetor de embedding para o texto fornecido.
    
    Args:
        text: Texto para gerar o embedding.
        
    Returns:
        Lista de floats representando o vetor de embedding.
    """
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Gera vetores de embedding para múltiplos textos.
    Mais eficiente que chamar generate_embedding individualmente.
    
    Args:
        texts: Lista de textos para gerar embeddings.
        
    Returns:
        Lista de vetores de embedding.
    """
    model = get_embedding_model()
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings.tolist()
