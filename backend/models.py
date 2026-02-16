import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from config import EMBEDDING_DIMENSION
from database import Base


class Document(Base):
    """Modelo para armazenar documentos com embeddings vetoriais."""

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(EMBEDDING_DIMENSION), nullable=True)
    metadata_ = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    @property
    def has_embedding(self) -> bool:
        """Retorna True se o documento tem embedding gerado."""
        return self.embedding is not None

    def __repr__(self):
        """Retorna representação string do documento."""
        return f"<Document(id={self.id}, title='{self.title}'>"


class ChatSession(Base):
    """Modelo para armazenar sessões de chat."""

    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamento com mensagens
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.timestamp"
    )

    def __repr__(self):
        """Retorna representação string da sessão."""
        return f"<ChatSession(id={self.id}, user_id={self.user_id})>"


class ChatMessage(Base):
    """Modelo para armazenar mensagens de chat."""

    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    metadata_ = Column(Text, nullable=True)

    # Relacionamento com sessão
    session = relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        """Retorna representação string da mensagem."""
        return f"<ChatMessage(id={self.id}, session_id={self.session_id}, role='{self.role}')>"
