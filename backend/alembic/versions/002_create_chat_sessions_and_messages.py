"""create chat sessions and messages tables

Revision ID: 002
Revises: 001_enable_pgvector_create_documents
Create Date: 2026-02-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '002_create_chat_sessions_and_messages'
down_revision: Union[str, None] = '001_enable_pgvector_create_documents'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Cria a tabela de sessões de chat
    op.create_table(
        'chat_sessions',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Cria a tabela de mensagens de chat
    op.create_table(
        'chat_messages',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', UUID(as_uuid=True), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('metadata_', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Cria índices para melhorar performance
    op.create_index('idx_chat_sessions_user_id', 'chat_sessions', ['user_id'])
    op.create_index('idx_chat_sessions_updated_at', 'chat_sessions', ['updated_at'])
    op.create_index('idx_chat_messages_session_id', 'chat_messages', ['session_id'])
    op.create_index('idx_chat_messages_timestamp', 'chat_messages', ['timestamp'])


def downgrade() -> None:
    # Remove os índices
    op.drop_index('idx_chat_messages_timestamp', table_name='chat_messages')
    op.drop_index('idx_chat_messages_session_id', table_name='chat_messages')
    op.drop_index('idx_chat_sessions_updated_at', table_name='chat_sessions')
    op.drop_index('idx_chat_sessions_user_id', table_name='chat_sessions')
    
    # Remove as tabelas
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
