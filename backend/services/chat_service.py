import json
import logging
import sys
import time
import uuid
from ast import literal_eval
from datetime import datetime
from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import desc
from sqlalchemy.orm import Session

from config import LLM_TEMPERATURE, RAG_TOP_K
from models import ChatMessage, ChatSession
from schemas.chat import (
    RESPONSE_SOURCE_DATABASE,
    RESPONSE_SOURCE_MODEL_FALLBACK,
    RESPONSE_SOURCE_NOT_APPLICABLE,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionUpdate,
    SendMessageRequest,
)
from schemas.document import ModelConfig
from services.document_service import search_documents
from services.llm_service import get_llm

logger = logging.getLogger(__name__)

# ID de usuário padrão temporário
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
RESPONSE_SOURCE_PREFIX_DATABASE = "[[RESPONSE_SOURCE:DATABASE]]"
RESPONSE_SOURCE_PREFIX_MODEL_FALLBACK = "[[RESPONSE_SOURCE:MODEL_FALLBACK]]"


def serialize_message_metadata(metadata: Optional[dict]) -> Optional[str]:
    """Serializa metadados de mensagem em JSON."""
    if not metadata:
        return None

    return json.dumps(metadata, ensure_ascii=True)


def parse_message_metadata(raw_metadata: Optional[str]) -> dict:
    """Converte metadados persistidos para dicionario."""
    if not raw_metadata:
        return {}

    try:
        parsed_metadata = json.loads(raw_metadata)
        return parsed_metadata if isinstance(parsed_metadata, dict) else {}
    except json.JSONDecodeError:
        try:
            parsed_metadata = literal_eval(raw_metadata)
            return parsed_metadata if isinstance(parsed_metadata, dict) else {}
        except (ValueError, SyntaxError):
            return {}


def get_message_response_source(raw_metadata: Optional[str], role: str) -> str:
    """Extrai a origem da resposta a partir dos metadados."""
    if role != "assistant":
        return RESPONSE_SOURCE_NOT_APPLICABLE

    metadata = parse_message_metadata(raw_metadata)
    response_source = metadata.get("response_source")

    if response_source in {
        RESPONSE_SOURCE_DATABASE,
        RESPONSE_SOURCE_MODEL_FALLBACK,
        RESPONSE_SOURCE_NOT_APPLICABLE,
    }:
        return response_source

    return RESPONSE_SOURCE_MODEL_FALLBACK


def build_chat_message_response(message: ChatMessage) -> ChatMessageResponse:
    """Converte modelo ORM em schema de resposta com status de grounding."""
    return ChatMessageResponse(
        id=message.id,
        session_id=message.session_id,
        content=message.content,
        role=message.role,
        timestamp=message.timestamp,
        metadata=message.metadata_,
        response_source=get_message_response_source(message.metadata_, message.role),
    )


def normalize_assistant_response(content: str, context_used: bool) -> tuple[str, str]:
    """Remove marcadores internos da LLM e identifica a origem da resposta."""
    normalized_content = content.strip()

    if normalized_content.startswith(RESPONSE_SOURCE_PREFIX_DATABASE):
        cleaned_content = normalized_content.removeprefix(RESPONSE_SOURCE_PREFIX_DATABASE).strip()
        return cleaned_content, RESPONSE_SOURCE_DATABASE

    if normalized_content.startswith(RESPONSE_SOURCE_PREFIX_MODEL_FALLBACK):
        cleaned_content = normalized_content.removeprefix(RESPONSE_SOURCE_PREFIX_MODEL_FALLBACK).strip()
        return cleaned_content, RESPONSE_SOURCE_MODEL_FALLBACK

    response_source = (
        RESPONSE_SOURCE_DATABASE if context_used else RESPONSE_SOURCE_MODEL_FALLBACK
    )
    return normalized_content, response_source


def create_session(db: Session, session_data: ChatSessionCreate) -> ChatSession:
    """Cria uma nova sessão de chat."""
    user_id = session_data.user_id or DEFAULT_USER_ID

    db_session = ChatSession(
        user_id=user_id,
        title=session_data.title or "Nova Conversa",
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_session(db: Session, session_id: uuid.UUID) -> Optional[ChatSession]:
    """Busca sessão por ID."""
    return db.query(ChatSession).filter(ChatSession.id == session_id).first()


def list_sessions(
    db: Session, user_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100
) -> list[ChatSession]:
    """Lista sessões de chat com filtro opcional por usuário."""
    query = db.query(ChatSession)

    if user_id:
        query = query.filter(ChatSession.user_id == user_id)

    return query.order_by(desc(ChatSession.updated_at)).offset(skip).limit(limit).all()


def count_sessions(db: Session, user_id: Optional[uuid.UUID] = None) -> int:
    """Conta o número total de sessões."""
    query = db.query(ChatSession)

    if user_id:
        query = query.filter(ChatSession.user_id == user_id)

    return query.count()


def update_session(
    db: Session, session_id: uuid.UUID, session_data: ChatSessionUpdate
) -> Optional[ChatSession]:
    """Atualiza uma sessão de chat."""
    db_session = get_session(db, session_id)
    if not db_session:
        return None

    if session_data.title is not None:
        db_session.title = session_data.title

    db.commit()
    db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: uuid.UUID) -> bool:
    """Deleta uma sessão de chat e todas as suas mensagens."""
    db_session = get_session(db, session_id)
    if not db_session:
        return False

    db.delete(db_session)
    db.commit()
    return True


def add_message(
    db: Session, session_id: uuid.UUID, message_data: SendMessageRequest
) -> Optional[ChatMessage]:
    """Adiciona uma mensagem a uma sessão."""
    # Verifica se a sessão existe
    db_session = get_session(db, session_id)
    if not db_session:
        return None

    db_message = ChatMessage(
        session_id=session_id,
        content=message_data.content,
        role=message_data.role,
        metadata_=serialize_message_metadata(message_data.metadata),
    )

    db.add(db_message)

    # Atualiza o updated_at da sessão com timestamp atual
    db_session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_message)
    return db_message


def get_message(db: Session, message_id: uuid.UUID) -> Optional[ChatMessage]:
    """Busca mensagem por ID."""
    return db.query(ChatMessage).filter(ChatMessage.id == message_id).first()


def list_messages(
    db: Session, session_id: uuid.UUID, skip: int = 0, limit: int = 1000
) -> list[ChatMessage]:
    """Lista mensagens de uma sessão ordenadas por timestamp."""
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp)
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_messages(db: Session, session_id: uuid.UUID) -> int:
    """Conta o número de mensagens em uma sessão."""
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).count()


def delete_message(db: Session, message_id: uuid.UUID) -> bool:
    """Deleta uma mensagem específica."""
    db_message = get_message(db, message_id)
    if not db_message:
        return False

    db.delete(db_message)
    db.commit()
    return True


def get_session_messages_count(db: Session, session_id: uuid.UUID) -> int:
    """Retorna o número de mensagens em uma sessão."""
    return count_messages(db, session_id)


def send_message_with_rag(
    db: Session,
    session_id: uuid.UUID,
    user_message: str,
    model_config: Optional[ModelConfig] = None,
    top_k: int = RAG_TOP_K,
) -> dict:
    """Processa mensagem do usuário usando RAG (Retrieval-Augmented Generation).

    Busca documentos similares no vector database e gera resposta usando LLM
    com contexto dos documentos encontrados.

    Args:
        db: Sessão do banco de dados
        session_id: ID da sessão de chat
        user_message: Mensagem do usuário
        model_config: Configuração do modelo (provedor, modelo, API keys)
        top_k: Número de documentos similares a recuperar

    Returns:
        Dicionário com user_message, assistant_response, e documentos usados
    """
    logger.info(f"[RAG Service] Iniciando processamento para session_id: {session_id}")
    sys.stdout.flush()

    # Verifica se a sessão existe
    step_start = time.time()
    db_session = get_session(db, session_id)
    if not db_session:
        raise ValueError("Sessão não encontrada")
    logger.info(f"[RAG Service] Verificação de sessão: {time.time() - step_start:.3f}s")
    sys.stdout.flush()

    # 1. Salva mensagem do usuário no banco
    step_start = time.time()
    user_msg_data = SendMessageRequest(content=user_message, role="user")
    user_db_message = add_message(db, session_id, user_msg_data)
    if not user_db_message:
        raise ValueError("Erro ao salvar mensagem do usuário")
    logger.info(f"[RAG Service] Salvamento mensagem usuário: {time.time() - step_start:.3f}s")
    sys.stdout.flush()

    # 2. Busca documentos similares
    step_start = time.time()
    search_results = search_documents(
        db=db,
        query=user_message,
        top_k=top_k,
        model_config=None,
    )
    logger.info(f"[RAG Service] Busca de documentos: {time.time() - step_start:.3f}s (encontrados: {len(search_results)})")
    sys.stdout.flush()

    # 3. Extrai contexto dos documentos encontrados
    step_start = time.time()
    context_parts = []
    sources = []
    for result in search_results:
        doc = result.document
        score = result.score
        context_parts.append(f"[Score: {score:.3f}] {doc.content}")
        sources.append(
            {
                "id": str(doc.id),
                "title": doc.title,
                "score": score,
            }
        )

    context = "\n\n".join(context_parts) if context_parts else "Nenhum documento relevante encontrado."
    logger.info(f"[RAG Service] Extração de contexto: {time.time() - step_start:.3f}s")
    sys.stdout.flush()

    # 4. Constrói prompt RAG
    # Verifica se é a primeira mensagem para gerar título depois
    is_first_message = count_messages(db, session_id) == 1  # Só tem a mensagem do usuário que acabou de ser salva

    prompt_template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Você é um assistente inteligente que responde perguntas baseado majoritariamente no contexto fornecido. "
                "Comece TODA resposta com exatamente um dos seguintes marcadores internos: "
                "[[RESPONSE_SOURCE:DATABASE]] quando a resposta estiver sustentada pelo contexto; "
                "[[RESPONSE_SOURCE:MODEL_FALLBACK]] quando o contexto não trouxer informação suficiente e você precisar complementar com conhecimento próprio. "
                "Nao explique nem mencione os marcadores fora do prefixo inicial. "
                "Seja conciso e direto em suas respostas.",
            ),
            (
                "human",
                "Contexto:\n{context}\n\nPergunta: {question}\n\nResposta:",
            ),
        ]
    )

    # 5. Gera resposta com LLM
    step_start = time.time()
    generated_title = None
    try:
        logger.info(f"[RAG Service] Iniciando geração LLM...")
        sys.stdout.flush()
        llm = get_llm(
            provider=model_config.provider if model_config else None,
            model=model_config.model if model_config else None,
            google_api_key=(
                model_config.api_keys.google_api_key
                if model_config and model_config.api_keys
                else None
            ),
            openai_api_key=(
                model_config.api_keys.openai_api_key
                if model_config and model_config.api_keys
                else None
            ),
            openrouter_api_key=(
                model_config.api_keys.openrouter_api_key
                if model_config and model_config.api_keys
                else None
            ),
            temperature=LLM_TEMPERATURE,
        )

        chain = prompt_template | llm
        response = chain.invoke({"context": context, "question": user_message})

        # Extrai o conteúdo da resposta (pode ser string ou lista em modelos multimodais)
        raw_content = response.content

        if isinstance(raw_content, list):
            # Formato multimodal: concatena textos
            assistant_content = " ".join(
                item.get("text", "") for item in raw_content
                if isinstance(item, dict) and item.get("type") == "text"
            )
        else:
            assistant_content = str(raw_content)

        assistant_content, response_source = normalize_assistant_response(
            assistant_content,
            len(context_parts) > 0,
        )

        logger.info(f"[RAG Service] Geração LLM: {time.time() - step_start:.3f}s")
        sys.stdout.flush()

        # 5.1. Gera título para a sessão se for a primeira mensagem
        if is_first_message:
            step_start = time.time()
            try:
                title_prompt = ChatPromptTemplate.from_messages(
                    [
                        (
                            "system",
                            "Gere um título curto e descritivo para esta conversa. "
                            "Máximo 40 caracteres. Responda APENAS com o título, nada mais.",
                        ),
                        (
                            "human",
                            "{question}",
                        ),
                    ]
                )
                title_chain = title_prompt | llm
                title_response = title_chain.invoke({"question": user_message})

                # Extrai texto do título
                title_raw = title_response.content
                if isinstance(title_raw, list):
                    generated_title = " ".join(
                        item.get("text", "") for item in title_raw
                        if isinstance(item, dict) and item.get("type") == "text"
                    ).strip()
                else:
                    generated_title = str(title_raw).strip().strip('"').strip("'")

                # Trunca se necessário
                if generated_title and len(generated_title) > 60:
                    generated_title = generated_title[:57] + "..."

                if generated_title:
                    logger.info(f"[RAG Service] Título gerado: {generated_title}")
                    db_session = get_session(db, session_id)
                    if db_session:
                        db_session.title = generated_title
                        db.commit()
                        logger.info(f"[RAG Service] Título da sessão atualizado para: {generated_title}")

                logger.info(f"[RAG Service] Geração título: {time.time() - step_start:.3f}s")
                sys.stdout.flush()
            except Exception as e:
                logger.warning(f"[RAG Service] Falha ao gerar título: {e}")
                sys.stdout.flush()

    except Exception as e:
        logger.error(f"[RAG Service] Erro na geração LLM após {time.time() - step_start:.3f}s: {str(e)}")
        sys.stdout.flush()
        assistant_content = f"Erro ao gerar resposta: {str(e)}"
        response_source = RESPONSE_SOURCE_NOT_APPLICABLE

    # 6. Salva resposta do assistente no banco
    step_start = time.time()
    assistant_msg_data = SendMessageRequest(
        content=assistant_content,
        role="assistant",
        metadata={
            "sources": sources,
            "context_used": len(context_parts) > 0,
            "response_source": response_source,
        },
    )
    assistant_db_message = add_message(db, session_id, assistant_msg_data)
    logger.info(f"[RAG Service] Salvamento mensagem assistente: {time.time() - step_start:.3f}s")
    sys.stdout.flush()

    return {
        "user_message": user_db_message,
        "assistant_message": assistant_db_message,
        "sources": sources,
        "context_used": len(context_parts) > 0,
        "title": generated_title,
    }
