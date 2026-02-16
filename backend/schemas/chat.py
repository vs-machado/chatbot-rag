from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.document import ModelConfig


class ChatMessageBase(BaseModel):
    """Schema base para mensagem de chat."""

    content: str = Field(..., min_length=1, description="Conteúdo da mensagem")
    role: str = Field(..., pattern="^(user|assistant|system)$", description="Papel do autor da mensagem")


class ChatMessageCreate(ChatMessageBase):
    """Schema para criação de mensagem."""

    metadata: Optional[dict] = Field(None, description="Metadados adicionais")


class ChatMessageResponse(ChatMessageBase):
    """Schema de resposta para mensagem."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    session_id: UUID
    timestamp: datetime
    metadata: Optional[str] = Field(None, alias="metadata_")


class ChatSessionBase(BaseModel):
    """Schema base para sessão de chat."""

    title: Optional[str] = Field(None, max_length=255, description="Título da sessão")


class ChatSessionCreate(ChatSessionBase):
    """Schema para criação de sessão."""

    user_id: Optional[UUID] = Field(None, description="ID do usuário (temporário)")


class ChatSessionUpdate(ChatSessionBase):
    """Schema para atualização de sessão."""

    pass


class ChatSessionResponse(ChatSessionBase):
    """Schema de resposta para sessão."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    message_count: int = Field(0, description="Número de mensagens na sessão")


class ChatSessionDetailResponse(ChatSessionResponse):
    """Schema de resposta detalhada com mensagens."""

    messages: list[ChatMessageResponse] = Field(default_factory=list, description="Lista de mensagens")


class ChatSessionListResponse(BaseModel):
    """Schema de resposta para lista de sessões."""

    sessions: list[ChatSessionResponse]
    total: int
    page: int
    page_size: int


class SendMessageRequest(BaseModel):
    """Schema para envio de mensagem."""

    content: str = Field(..., min_length=1, description="Conteúdo da mensagem")
    role: str = Field(default="user", pattern="^(user|assistant|system)$", description="Papel do autor")
    metadata: Optional[dict] = Field(None, description="Metadados adicionais")


class ChatMessageListResponse(BaseModel):
    """Schema de resposta para lista de mensagens."""

    messages: list[ChatMessageResponse]
    total: int
    session_id: UUID


class ChatErrorResponse(BaseModel):
    """Schema de resposta de erro."""

    detail: str
    error_code: Optional[str] = None


class DocumentSource(BaseModel):
    """Schema para fonte de documento usado no RAG."""

    id: str
    title: str
    score: float


class ChatRAGRequest(BaseModel):
    """Schema para requisição de mensagem com RAG."""

    model_config = ConfigDict(populate_by_name=True)

    content: str = Field(..., min_length=1, description="Conteúdo da mensagem")
    top_k: int = Field(5, ge=1, le=20, description="Número de documentos a recuperar")
    model_config_: Optional[ModelConfig] = Field(
        None, alias="model_config", description="Configuração do modelo LLM"
    )


class ChatRAGResponse(BaseModel):
    """Schema de resposta para mensagem com RAG."""

    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
    sources: list[DocumentSource]
    context_used: bool
    title: Optional[str] = Field(None, description="Título gerado para a sessão (apenas na primeira mensagem)")
