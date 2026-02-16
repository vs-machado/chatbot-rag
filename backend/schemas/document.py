from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class APIKeyConfig(BaseModel):
    """Configuração de API key fornecida pelo usuário."""

    google_api_key: Optional[str] = Field(None, description="API key do Google Gemini")
    openai_api_key: Optional[str] = Field(None, description="API key da OpenAI")


class ModelConfig(BaseModel):
    """Configuração de modelo para embedding ou LLM."""

    provider: Optional[str] = Field(
        None, description="Provedor (google, openai, sentence_transformers)"
    )
    model: Optional[str] = Field(None, description="Nome do modelo")
    api_keys: Optional[APIKeyConfig] = Field(None, description="API keys do usuário")


class DocumentCreate(BaseModel):
    """Schema para criação de documento via texto."""

    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., min_length=1, max_length=255, description="Título do documento")
    content: str = Field(..., min_length=1, description="Conteúdo do documento")
    metadata: Optional[dict] = Field(None, description="Metadados adicionais")
    model_config_: Optional[ModelConfig] = Field(
        None, alias="model_config", description="Configuração de modelo para embedding"
    )


class DocumentUploadConfig(BaseModel):
    """Configuração para upload de arquivo."""

    model_config = ConfigDict(populate_by_name=True)

    model_config_: Optional[ModelConfig] = Field(
        None, alias="model_config", description="Configuração de modelo para embedding"
    )
    chunk_size: Optional[int] = Field(
        None, ge=100, le=10000, description="Tamanho do chunk em caracteres"
    )
    chunk_overlap: Optional[int] = Field(None, ge=0, le=1000, description="Overlap entre chunks")


class DocumentResponse(BaseModel):
    """Schema de resposta para documento."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    title: str
    content: str
    metadata_: Optional[str] = Field(None, alias="metadata_")
    has_embedding: Optional[bool] = Field(None, description="Se o documento tem embedding gerado")
    created_at: datetime
    updated_at: datetime

    @field_validator("metadata_", mode="before")
    @classmethod
    def validate_metadata(cls, v):
        """Valida o campo metadata_, extraindo do SQLAlchemy corretamente."""
        # Se for o objeto MetaData do SQLAlchemy, retorna None
        if hasattr(v, 'tables'):
            return None
        return v

    @field_validator("has_embedding", mode="before")
    @classmethod
    def validate_has_embedding(cls, v):
        """Valida o campo has_embedding."""
        if v is None:
            return False
        return bool(v)


class DocumentListResponse(BaseModel):
    """Schema de resposta para lista de documentos."""

    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class DocumentSearchRequest(BaseModel):
    """Schema para busca semântica de documentos."""

    model_config = ConfigDict(populate_by_name=True)

    query: str = Field(..., min_length=1, description="Query de busca")
    top_k: int = Field(5, ge=1, le=100, description="Número de resultados")
    model_config_: Optional[ModelConfig] = Field(
        None, alias="model_config", description="Configuração de modelo para embedding da query"
    )


class DocumentSearchResult(BaseModel):
    """Resultado de busca semântica."""

    document: DocumentResponse
    score: float = Field(..., description="Score de similaridade (0-1)")


class DocumentSearchResponse(BaseModel):
    """Schema de resposta para busca semântica."""

    results: list[DocumentSearchResult]
    query: str
    total: int


class UploadResponse(BaseModel):
    """Schema de resposta para upload de arquivo."""

    message: str
    documents_created: int
    document_ids: list[UUID]


class ErrorResponse(BaseModel):
    """Schema de resposta de erro."""

    detail: str
    error_code: Optional[str] = None
