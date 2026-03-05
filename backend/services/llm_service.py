from typing import Optional

from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from config import (
    GOOGLE_API_KEY,
    LLM_MODEL,
    LLM_PROVIDER,
    LLM_TEMPERATURE,
    OPENAI_API_KEY,
    OPENROUTER_API_KEY,
    OPENROUTER_APP_NAME,
    OPENROUTER_BASE_URL,
    OPENROUTER_SITE_URL,
    LLMProvider,
)

AVAILABLE_LLM_MODELS: list[dict[str, str]] = [
    {
        "id": "gemini-2.5-flash",
        "label": "Gemini 2.5 Flash",
        "provider": "google",
    },
    {
        "id": "arcee-ai/trinity-large-preview:free",
        "label": "Trinity Large (Free)",
        "provider": "openrouter",
    },
    {
        "id": "arcee-ai/trinity-mini:free",
        "label": "Trinity Mini (Free)",
        "provider": "openrouter",
    },
    {
        "id": "openai/gpt-oss-120b:free",
        "label": "GPT OSS 120B (Free)",
        "provider": "openrouter",
    },
]


def _get_openrouter_headers() -> dict[str, str]:
    """Retorna headers opcionais recomendados pelo OpenRouter."""
    headers: dict[str, str] = {}

    if OPENROUTER_SITE_URL:
        headers["HTTP-Referer"] = OPENROUTER_SITE_URL

    if OPENROUTER_APP_NAME:
        headers["X-Title"] = OPENROUTER_APP_NAME

    return headers


def get_llm(
    provider: Optional[str] = None,
    model: Optional[str] = None,
    google_api_key: Optional[str] = None,
    openai_api_key: Optional[str] = None,
    openrouter_api_key: Optional[str] = None,
    temperature: float = LLM_TEMPERATURE,
    **kwargs,
) -> BaseChatModel:
    """Retorna uma instância do LLM baseado no provedor especificado.

    Args:
        provider: Provedor do LLM (google, openai, openrouter). Usa LLM_PROVIDER se não especificado.
        model: Nome do modelo. Usa LLM_MODEL se não especificado.
        google_api_key: API key do Google. Usa GOOGLE_API_KEY se não especificado.
        openai_api_key: API key da OpenAI. Usa OPENAI_API_KEY se não especificado.
        openrouter_api_key: API key do OpenRouter. Usa OPENROUTER_API_KEY se não especificado.
        temperature: Temperatura para geração (0-1).
        **kwargs: Argumentos adicionais passados ao modelo.

    Returns:
        Instância do LLM configurado.

    Raises:
        ValueError: Se o provedor não for suportado ou API key não estiver configurada.
    """
    # Usa valores padrão se não especificados
    provider = provider or LLM_PROVIDER
    model = model or LLM_MODEL

    # Normaliza o provedor
    if isinstance(provider, LLMProvider):
        provider = provider.value
    provider = provider.lower()

    if provider == "google":
        api_key = google_api_key or GOOGLE_API_KEY
        if not api_key:
            raise ValueError(
                "Google API key não configurada. Forneça via parâmetro ou variável GOOGLE_API_KEY."
            )

        # Configuração de thinking para Gemini 3 - reduz esforço de raciocínio para melhorar velocidade
        thinking_config = {"thinking_level": "LOW"} if "gemini-3" in model else None

        # Timeout para evitar esperas muito longas (90 segundos)
        timeout = kwargs.pop("timeout", 90)

        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=temperature,
            thinking_config=thinking_config,
            timeout=timeout,
            **kwargs
        )

    elif provider == "openai":
        api_key = openai_api_key or OPENAI_API_KEY
        if not api_key:
            raise ValueError(
                "OpenAI API key não configurada. Forneça via parâmetro ou variável OPENAI_API_KEY."
            )

        return ChatOpenAI(model=model, api_key=api_key, temperature=temperature, **kwargs)

    elif provider == "openrouter":
        api_key = openrouter_api_key or OPENROUTER_API_KEY
        if not api_key:
            raise ValueError(
                "OpenRouter API key não configurada. Forneça via parâmetro ou variável OPENROUTER_API_KEY."
            )

        base_url = kwargs.pop("base_url", OPENROUTER_BASE_URL)
        custom_headers = kwargs.pop("default_headers", None) or {}
        default_headers = {**_get_openrouter_headers(), **custom_headers}

        return ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature,
            default_headers=default_headers,
            **kwargs,
        )

    else:
        raise ValueError(
            f"Provedor de LLM não suportado: {provider}. Use 'google', 'openai' ou 'openrouter'."
        )


def get_available_llm_models() -> list[dict[str, str]]:
    """Retorna os modelos de LLM disponíveis por provedor.

    Returns:
        Lista de modelos disponíveis com provedor e rótulo para UI.
    """
    return AVAILABLE_LLM_MODELS
