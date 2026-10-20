"""Expõe serviços sem carregar dependências de chat no processo de embeddings."""

__all__ = [
    "add_message",
    "count_messages",
    "count_sessions",
    "create_session",
    "delete_message",
    "delete_session",
    "get_message",
    "get_session",
    "list_messages",
    "list_sessions",
    "send_message_with_rag",
    "update_session",
]


def __getattr__(name: str):
    """Preserva exports anteriores, importando serviços de chat apenas quando usados."""
    if name in __all__:
        from services import chat_service

        return getattr(chat_service, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
