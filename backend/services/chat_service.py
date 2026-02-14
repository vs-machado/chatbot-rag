import uuid
from datetime import datetime
from typing import Optional

from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy import desc
from sqlalchemy.orm import Session

from models import ChatMessage, ChatSession
from schemas.chat import ChatSessionCreate, ChatSessionUpdate, SendMessageRequest
from schemas.document import ModelConfig
from services.document_service import search_documents
from services.llm_service import get_llm

# ID de usuário padrão temporário
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


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
        metadata_=str(message_data.metadata) if message_data.metadata else None,
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
    top_k: int = 5,
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
    # Verifica se a sessão existe
    db_session = get_session(db, session_id)
    if not db_session:
        raise ValueError("Sessão não encontrada")

    # 1. Salva mensagem do usuário no banco
    user_msg_data = SendMessageRequest(content=user_message, role="user")
    user_db_message = add_message(db, session_id, user_msg_data)
    if not user_db_message:
        raise ValueError("Erro ao salvar mensagem do usuário")

    # 2. Busca documentos similares
    search_results = search_documents(
        db=db,
        query=user_message,
        top_k=top_k,
        model_config=model_config,
    )

    # 3. Extrai contexto dos documentos encontrados
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

    # 4. Constrói prompt RAG
    prompt_template = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Você é um assistente inteligente que responde perguntas baseado majoritariamente no contexto fornecido. "
                "Se o contexto não contiver informações suficientes, diga que não encontrou informações relevantes e então forneça uma resposta baseada em seu conhecimento próprio. "
                "Seja conciso e direto em suas respostas.",
            ),
            (
                "human",
                "Contexto:\n{context}\n\nPergunta: {question}\n\nResposta:",
            ),
        ]
    )

    # 5. Gera resposta com LLM
    try:
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
            temperature=0.7,
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

    except Exception as e:
        assistant_content = f"Erro ao gerar resposta: {str(e)}"

    # 6. Salva resposta do assistente no banco
    assistant_msg_data = SendMessageRequest(
        content=assistant_content,
        role="assistant",
        metadata={
            "sources": sources,
            "context_used": len(context_parts) > 0,
        },
    )
    assistant_db_message = add_message(db, session_id, assistant_msg_data)

    return {
        "user_message": user_db_message,
        "assistant_message": assistant_db_message,
        "sources": sources,
        "context_used": len(context_parts) > 0,
    }
