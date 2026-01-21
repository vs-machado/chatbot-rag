"""enable pgvector and create documents table

Revision ID: 001
Revises: 
Create Date: 2026-01-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# Importa dimensão centralizada
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from config import EMBEDDING_DIMENSION


# revision identifiers, used by Alembic.
revision: str = '001_enable_pgvector_create_documents'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Habilita a extensão pgvector no PostgreSQL
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Cria a tabela de documentos com dimensão configurada em config.py
    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('embedding', Vector(EMBEDDING_DIMENSION), nullable=True),
        sa.Column('metadata_', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Cria índice para busca vetorial usando HNSW (mais rápido para grandes datasets)
    op.execute('''
        CREATE INDEX idx_documents_embedding 
        ON documents 
        USING hnsw (embedding vector_cosine_ops)
    ''')


def downgrade() -> None:
    # Remove o índice vetorial
    op.execute('DROP INDEX IF EXISTS idx_documents_embedding')
    
    # Remove a tabela de documentos
    op.drop_table('documents')
    
    # Remove a extensão pgvector (opcional, pode afetar outras tabelas)
    # op.execute('DROP EXTENSION IF EXISTS vector')
