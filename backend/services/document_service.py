import uuid
from typing import Optional

import docx
from fastapi import HTTPException, UploadFile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from sqlalchemy import desc
from sqlalchemy.orm import Session

from config import CHUNK_OVERLAP, CHUNK_SIZE
from models import Document
from schemas.document import DocumentCreate, DocumentSearchResult, ModelConfig
from services.embedding_service import generate_embedding


def extract_text_from_file(file: UploadFile) -> str:
    """Extrai texto de um arquivo baseado no tipo MIME."""
    content = ""
    file.file.seek(0)

    if file.content_type == "application/pdf":
        reader = PdfReader(file.file)
        for page in reader.pages:
            content += page.extract_text() + "\n"

    elif (
        file.content_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        doc = docx.Document(file.file)
        for para in doc.paragraphs:
            content += para.text + "\n"

    elif file.content_type.startswith("text/"):
        content = file.file.read().decode("utf-8")

    else:
        raise HTTPException(
            status_code=400, detail=f"Tipo de arquivo não suportado: {file.content_type}"
        )

    return content


def create_document(db: Session, doc_data: DocumentCreate) -> Document:
    """Cria um novo documento e gera seu embedding."""
    provider = None
    model = None
    api_key_google = None
    api_key_openai = None

    if doc_data.model_config_:
        provider = doc_data.model_config_.provider
        model = doc_data.model_config_.model
        if doc_data.model_config_.api_keys:
            api_key_google = doc_data.model_config_.api_keys.google_api_key
            api_key_openai = doc_data.model_config_.api_keys.openai_api_key

    embedding = generate_embedding(
        doc_data.content,
        provider=provider,
        model=model,
        google_api_key=api_key_google,
        openai_api_key=api_key_openai,
    )

    # Verifica dimensão do embedding.
    # Se mudar o modelo no meio do caminho sem migrar, vai dar erro no banco se dimensão for diferente
    # O ideal seria validar contra a coluna do banco, mas aqui assumimos que o user sabe o que faz
    # ou que estamos usando o padrão.

    db_doc = Document(
        title=doc_data.title,
        content=doc_data.content,
        embedding=embedding,
        metadata_=str(doc_data.metadata) if doc_data.metadata else None,
    )

    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc


def process_and_create_documents_from_file(
    db: Session,
    file: UploadFile,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
    model_config: Optional[ModelConfig] = None,
) -> list[Document]:
    """Processa um arquivo, divide em chunks e cria documentos."""
    text = extract_text_from_file(file)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Arquivo vazio ou sem texto extraível")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )

    chunks = text_splitter.split_text(text)
    created_docs = []

    # Extrai configs
    provider = model_config.provider if model_config else None
    model = model_config.model if model_config else None
    api_key_google = (
        model_config.api_keys.google_api_key if model_config and model_config.api_keys else None
    )
    api_key_openai = (
        model_config.api_keys.openai_api_key if model_config and model_config.api_keys else None
    )

    for i, chunk in enumerate(chunks):
        embedding = generate_embedding(
            chunk,
            provider=provider,
            model=model,
            google_api_key=api_key_google,
            openai_api_key=api_key_openai,
        )

        doc = Document(
            title=f"{file.filename} - Parte {i + 1}",
            content=chunk,
            embedding=embedding,
            metadata_=f'{{"source": "{file.filename}", "chunk": {i}, "total_chunks": {len(chunks)}}}',
        )
        db.add(doc)
        created_docs.append(doc)

    db.commit()
    for doc in created_docs:
        db.refresh(doc)

    return created_docs


def list_documents(db: Session, skip: int = 0, limit: int = 100) -> list[Document]:
    """Lista documentos paginados."""
    return db.query(Document).order_by(desc(Document.created_at)).offset(skip).limit(limit).all()


def get_document(db: Session, document_id: uuid.UUID) -> Optional[Document]:
    """Busca documento por ID."""
    return db.query(Document).filter(Document.id == document_id).first()


def delete_document(db: Session, document_id: uuid.UUID) -> bool:
    """Deleta um documento."""
    doc = get_document(db, document_id)
    if not doc:
        return False
    db.delete(doc)
    db.commit()
    return True


def search_documents(
    db: Session, query: str, top_k: int = 5, model_config: Optional[ModelConfig] = None
) -> list[DocumentSearchResult]:
    """Busca documentos semanticamente similares."""
    # Extrai configs
    provider = model_config.provider if model_config else None
    model = model_config.model if model_config else None
    api_key_google = (
        model_config.api_keys.google_api_key if model_config and model_config.api_keys else None
    )
    api_key_openai = (
        model_config.api_keys.openai_api_key if model_config and model_config.api_keys else None
    )

    # Gera embedding da query
    query_embedding = generate_embedding(
        query,
        provider=provider,
        model=model,
        google_api_key=api_key_google,
        openai_api_key=api_key_openai,
    )

    # Busca usando pgvector (distância de cosseno <=> l2_distance se normalizado, mas pgvector tem operador específico)
    # A classe Document tem a coluna embedding.
    # Usamos order_by(Document.embedding.cosine_distance(query_embedding))

    results = (
        db.query(Document, Document.embedding.cosine_distance(query_embedding).label("distance"))
        .order_by(Document.embedding.cosine_distance(query_embedding))
        .limit(top_k)
        .all()
    )

    search_results = []
    for doc, distance in results:
        # Convertemos distância para similaridade (aproximado)
        # Cosine distance é 1 - cosine similarity.
        similarity = 1 - distance
        search_results.append(DocumentSearchResult(document=doc, score=similarity))

    return search_results
