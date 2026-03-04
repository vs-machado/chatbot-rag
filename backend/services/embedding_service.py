from typing import Optional

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from sentence_transformers import SentenceTransformer

from config import (
    EMBEDDING_MODEL,
    EMBEDDING_PROVIDER,
    GOOGLE_API_KEY,
    OPENAI_API_KEY,
    EmbeddingProvider,
)

# Instância singleton do modelo local de embeddings
_local_model: SentenceTransformer | None = None
_local_model_name: str | None = None


def _get_local_model(model_name: str) -> SentenceTransformer:
    """Carrega o modelo local (SentenceTransformer)."""
    global _local_model, _local_model_name
    # Recarrega se o modelo mudar ou ainda não existir
    if _local_model is None or _local_model_name != model_name or _local_model.get_sentence_embedding_dimension() is None:
        trust_remote_code = model_name.lower().startswith("qwen/")
        _local_model = SentenceTransformer(model_name, trust_remote_code=trust_remote_code)
        _local_model_name = model_name
    return _local_model


def _encode_with_optional_query_prompt(
    model: SentenceTransformer,
    text_or_texts: str | list[str],
    is_query: bool,
) -> list[float] | list[list[float]]:
    """Codifica texto(s), usando prompt de query quando o modelo suportar."""
    use_query_prompt = bool(
        is_query and hasattr(model, "prompts") and "query" in (model.prompts or {})
    )
    if use_query_prompt:
        embedding = model.encode(text_or_texts, convert_to_numpy=True, prompt_name="query")
    else:
        embedding = model.encode(text_or_texts, convert_to_numpy=True)

    return embedding.tolist()


def generate_embedding(
    text: str,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    google_api_key: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    is_query: bool = False,
) -> list[float]:
    """Gera um vetor de embedding para o texto fornecido.

    Args:
        text: Texto para gerar o embedding.
        provider: Provedor de embedding (google, openai, sentence_transformers).
        model: Nome do modelo.
        google_api_key: API Key do Google (se provider=google).
        openai_api_key: API Key da OpenAI (se provider=openai).
        is_query: Define se o texto é uma query de busca.

    Returns:
        Lista de floats representando o vetor de embedding.
    """
    provider = provider or EMBEDDING_PROVIDER
    if hasattr(provider, "value"):
        provider = provider.value
    provider = str(provider).lower()

    model = model or EMBEDDING_MODEL

    if provider == EmbeddingProvider.SENTENCE_TRANSFORMERS:
        local_model = _get_local_model(model)
        return _encode_with_optional_query_prompt(local_model, text, is_query)

    elif provider == EmbeddingProvider.GOOGLE:
        api_key = google_api_key or GOOGLE_API_KEY
        if not api_key:
            raise ValueError("Google API key não configurada.")

        embeddings_service = GoogleGenerativeAIEmbeddings(model=model, google_api_key=api_key)
        return embeddings_service.embed_query(text)

    elif provider == EmbeddingProvider.OPENAI:
        api_key = openai_api_key or OPENAI_API_KEY
        if not api_key:
            raise ValueError("OpenAI API key não configurada.")

        embeddings_service = OpenAIEmbeddings(model=model, api_key=api_key)
        return embeddings_service.embed_query(text)

    else:
        raise ValueError(f"Provedor de embedding desconhecido: {provider}")


def generate_embeddings(
    texts: list[str],
    provider: Optional[str] = None,
    model: Optional[str] = None,
    google_api_key: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    is_query: bool = False,
) -> list[list[float]]:
    """Gera vetores de embedding para múltiplos textos."""
    provider = provider or EMBEDDING_PROVIDER
    if hasattr(provider, "value"):
        provider = provider.value
    provider = str(provider).lower()

    model = model or EMBEDDING_MODEL

    if provider == EmbeddingProvider.SENTENCE_TRANSFORMERS:
        local_model = _get_local_model(model)
        return _encode_with_optional_query_prompt(local_model, texts, is_query)

    elif provider == EmbeddingProvider.GOOGLE:
        api_key = google_api_key or GOOGLE_API_KEY
        if not api_key:
            raise ValueError("Google API key não configurada.")

        embeddings_service = GoogleGenerativeAIEmbeddings(model=model, google_api_key=api_key)
        return embeddings_service.embed_documents(texts)

    elif provider == EmbeddingProvider.OPENAI:
        api_key = openai_api_key or OPENAI_API_KEY
        if not api_key:
            raise ValueError("OpenAI API key não configurada.")

        embeddings_service = OpenAIEmbeddings(model=model, api_key=api_key)
        return embeddings_service.embed_documents(texts)

    else:
        raise ValueError(f"Provedor de embedding desconhecido: {provider}")
