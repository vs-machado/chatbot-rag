"""Router para endpoints de chat."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from controllers.chat import (
    add_message_controller,
    create_session_controller,
    delete_message_controller,
    delete_session_controller,
    get_session_controller,
    list_available_models_controller,
    list_messages_controller,
    list_sessions_controller,
    send_message_with_rag_controller,
    update_session_controller,
)
from database import get_db
from schemas.chat import (
    ChatMessageListResponse,
    ChatMessageResponse,
    ChatModelListResponse,
    ChatRAGRequest,
    ChatRAGResponse,
    ChatSessionCreate,
    ChatSessionDetailResponse,
    ChatSessionListResponse,
    ChatSessionResponse,
    ChatSessionUpdate,
    SendMessageRequest,
)

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["chat"],
    responses={404: {"description": "Sessão ou mensagem não encontrada"}},
)


# Endpoints de Sessões
@router.get("/models", response_model=ChatModelListResponse)
def list_available_models():
    """Lista modelos disponíveis para uso no chat."""
    return list_available_models_controller()


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: ChatSessionCreate,
    db: Session = Depends(get_db),
):
    """Cria uma nova sessão de chat."""
    return create_session_controller(session_data=session_data, db=db)


@router.get("/sessions", response_model=ChatSessionListResponse)
def list_sessions(
    user_id: Optional[uuid.UUID] = Query(None, description="Filtrar por ID do usuário"),
    skip: int = Query(0, ge=0, description="Número de registros para pular"),
    limit: int = Query(100, ge=1, le=1000, description="Limite de registros por página"),
    db: Session = Depends(get_db),
):
    """Lista todas as sessões de chat com paginação."""
    return list_sessions_controller(user_id=user_id, skip=skip, limit=limit, db=db)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Obtém detalhes de uma sessão específica com todas as mensagens."""
    return get_session_controller(session_id=session_id, db=db)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session(
    session_id: uuid.UUID,
    session_data: ChatSessionUpdate,
    db: Session = Depends(get_db),
):
    """Atualiza o título ou dados de uma sessão."""
    return update_session_controller(
        session_id=session_id, session_data=session_data, db=db
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Remove uma sessão de chat e todas as suas mensagens."""
    delete_session_controller(session_id=session_id, db=db)


# Endpoints de Mensagens
@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def add_message(
    session_id: uuid.UUID,
    message_data: SendMessageRequest,
    db: Session = Depends(get_db),
):
    """Adiciona uma nova mensagem a uma sessão existente."""
    return add_message_controller(session_id=session_id, message_data=message_data, db=db)


@router.get("/sessions/{session_id}/messages", response_model=ChatMessageListResponse)
def list_messages(
    session_id: uuid.UUID,
    skip: int = Query(0, ge=0, description="Número de registros para pular"),
    limit: int = Query(1000, ge=1, le=10000, description="Limite de mensagens"),
    db: Session = Depends(get_db),
):
    """Lista todas as mensagens de uma sessão específica."""
    return list_messages_controller(session_id=session_id, skip=skip, limit=limit, db=db)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Remove uma mensagem específica."""
    delete_message_controller(message_id=message_id, db=db)


# Endpoint RAG (Retrieval-Augmented Generation)
@router.post("/sessions/{session_id}/rag", response_model=ChatRAGResponse, status_code=status.HTTP_201_CREATED)
def send_message_with_rag(
    session_id: uuid.UUID,
    request: ChatRAGRequest,
    db: Session = Depends(get_db),
):
    """Envia mensagem e recebe resposta com RAG (busca em documentos + LLM).

    Busca documentos similares no banco vetorial e usa o contexto
    para gerar uma resposta via LLM.
    """
    return send_message_with_rag_controller(session_id=session_id, request=request, db=db)
