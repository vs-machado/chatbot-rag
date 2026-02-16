"""Controllers para gerenciamento de chat."""

import logging
import sys
import time
import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from schemas.chat import (
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatRAGRequest,
    ChatRAGResponse,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
    DocumentSource,
    SendMessageRequest,
)
from services import chat_service

logger = logging.getLogger(__name__)


def create_session_controller(
    session_data: ChatSessionCreate, db: Session
) -> ChatSessionResponse:
    """Controller para criar nova sessão de chat."""
    try:
        db_session = chat_service.create_session(db, session_data)
        return ChatSessionResponse(
            id=db_session.id,
            user_id=db_session.user_id,
            title=db_session.title,
            created_at=db_session.created_at,
            updated_at=db_session.updated_at,
            message_count=0,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao criar sessão: {str(e)}"
        ) from e


def list_sessions_controller(
    user_id: Optional[uuid.UUID], skip: int, limit: int, db: Session
) -> ChatSessionListResponse:
    """Controller para listar sessões de chat."""
    try:
        sessions = chat_service.list_sessions(db, user_id=user_id, skip=skip, limit=limit)
        total = chat_service.count_sessions(db, user_id=user_id)

        session_responses = []
        for session in sessions:
            message_count = chat_service.get_session_messages_count(db, session.id)
            session_responses.append(
                ChatSessionResponse(
                    id=session.id,
                    user_id=session.user_id,
                    title=session.title,
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                    message_count=message_count,
                )
            )

        return ChatSessionListResponse(
            sessions=session_responses,
            total=total,
            page=(skip // limit) + 1 if limit > 0 else 1,
            page_size=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar sessões: {str(e)}"
        ) from e


def get_session_controller(session_id: uuid.UUID, db: Session) -> ChatSessionDetailResponse:
    """Controller para obter detalhes de uma sessão com mensagens."""
    try:
        db_session = chat_service.get_session(db, session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        messages = chat_service.list_messages(db, session_id)
        message_count = len(messages)

        message_responses = [
            ChatMessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                content=msg.content,
                role=msg.role,
                timestamp=msg.timestamp,
                metadata=msg.metadata_,
            )
            for msg in messages
        ]

        return ChatSessionDetailResponse(
            id=db_session.id,
            user_id=db_session.user_id,
            title=db_session.title,
            created_at=db_session.created_at,
            updated_at=db_session.updated_at,
            message_count=message_count,
            messages=message_responses,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao obter sessão: {str(e)}"
        ) from e


def update_session_controller(
    session_id: uuid.UUID, session_data: ChatSessionUpdate, db: Session
) -> ChatSessionResponse:
    """Controller para atualizar sessão de chat."""
    try:
        db_session = chat_service.update_session(db, session_id, session_data)
        if not db_session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        message_count = chat_service.get_session_messages_count(db, session_id)

        return ChatSessionResponse(
            id=db_session.id,
            user_id=db_session.user_id,
            title=db_session.title,
            created_at=db_session.created_at,
            updated_at=db_session.updated_at,
            message_count=message_count,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao atualizar sessão: {str(e)}"
        ) from e


def delete_session_controller(session_id: uuid.UUID, db: Session) -> None:
    """Controller para deletar sessão de chat."""
    try:
        success = chat_service.delete_session(db, session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao deletar sessão: {str(e)}"
        ) from e


def add_message_controller(
    session_id: uuid.UUID, message_data: SendMessageRequest, db: Session
) -> ChatMessageResponse:
    """Controller para adicionar mensagem a uma sessão."""
    try:
        db_message = chat_service.add_message(db, session_id, message_data)
        if not db_message:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        return ChatMessageResponse(
            id=db_message.id,
            session_id=db_message.session_id,
            content=db_message.content,
            role=db_message.role,
            timestamp=db_message.timestamp,
            metadata=db_message.metadata_,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao adicionar mensagem: {str(e)}"
        ) from e


def list_messages_controller(
    session_id: uuid.UUID, skip: int, limit: int, db: Session
) -> ChatMessageListResponse:
    """Controller para listar mensagens de uma sessão."""
    try:
        # Verifica se a sessão existe
        db_session = chat_service.get_session(db, session_id)
        if not db_session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        messages = chat_service.list_messages(db, session_id, skip=skip, limit=limit)
        total = chat_service.count_messages(db, session_id)

        message_responses = [
            ChatMessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                content=msg.content,
                role=msg.role,
                timestamp=msg.timestamp,
                metadata=msg.metadata_,
            )
            for msg in messages
        ]

        return ChatMessageListResponse(
            messages=message_responses,
            total=total,
            session_id=session_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao listar mensagens: {str(e)}"
        ) from e


def delete_message_controller(message_id: uuid.UUID, db: Session) -> None:
    """Controller para deletar uma mensagem."""
    try:
        success = chat_service.delete_message(db, message_id)
        if not success:
            raise HTTPException(status_code=404, detail="Mensagem não encontrada")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Erro ao deletar mensagem: {str(e)}"
        ) from e


def send_message_with_rag_controller(
    session_id: uuid.UUID, request: ChatRAGRequest, db: Session
) -> ChatRAGResponse:
    """Controller para enviar mensagem com RAG (busca em documentos + LLM)."""
    start_time = time.time()
    logger.info(f"[RAG] Iniciando processamento - session_id: {session_id}")
    sys.stdout.flush()

    try:
        result = chat_service.send_message_with_rag(
            db=db,
            session_id=session_id,
            user_message=request.content,
            model_config=request.model_config_,
            top_k=request.top_k,
        )

        duration = time.time() - start_time
        logger.info(f"[RAG] Concluído em {duration:.2f}s - session_id: {session_id}")
        sys.stdout.flush()

        user_msg = result["user_message"]
        assistant_msg = result["assistant_message"]

        return ChatRAGResponse(
            user_message=ChatMessageResponse(
                id=user_msg.id,
                session_id=user_msg.session_id,
                content=user_msg.content,
                role=user_msg.role,
                timestamp=user_msg.timestamp,
                metadata=user_msg.metadata_,
            ),
            assistant_message=ChatMessageResponse(
                id=assistant_msg.id,
                session_id=assistant_msg.session_id,
                content=assistant_msg.content,
                role=assistant_msg.role,
                timestamp=assistant_msg.timestamp,
                metadata=assistant_msg.metadata_,
            ),
            sources=[DocumentSource(**source) for source in result["sources"]],
            context_used=result["context_used"],
            title=result.get("title"),
        )
    except ValueError as e:
        duration = time.time() - start_time
        logger.error(f"[RAG] Erro após {duration:.2f}s - session_id: {session_id}: {str(e)}")
        sys.stdout.flush()
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"[RAG] Erro após {duration:.2f}s - session_id: {session_id}: {str(e)}")
        sys.stdout.flush()
        raise HTTPException(
            status_code=500, detail=f"Erro ao processar mensagem com RAG: {str(e)}"
        ) from e
