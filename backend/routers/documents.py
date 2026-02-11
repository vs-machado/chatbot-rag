"""Router para endpoints de documentos."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from controllers.documents import (
    delete_document_controller,
    list_documents_controller,
    search_documents_controller,
    upload_document_controller,
)
from database import get_db
from schemas.document import (
    DocumentListResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
    UploadResponse,
)

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["documents"],
    responses={404: {"description": "Documento não encontrado"}},
)


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    model_configuration: Optional[str] = Form(None, alias="model_config"),
    chunk_size: Optional[int] = Form(1000),
    chunk_overlap: Optional[int] = Form(200),
    db: Session = Depends(get_db),
):
    """Faz upload de um arquivo (PDF, DOCX, TXT), processa e gera embeddings."""
    return await upload_document_controller(
        file=file,
        model_configuration=model_configuration,
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        db=db,
    )


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Lista todos os documentos armazenados."""
    return list_documents_controller(skip=skip, limit=limit, db=db)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    """Remove um documento pelo ID."""
    delete_document_controller(document_id=document_id, db=db)


@router.post("/search", response_model=DocumentSearchResponse)
def search_documents(request: DocumentSearchRequest, db: Session = Depends(get_db)):
    """Busca semântica nos documentos."""
    return search_documents_controller(request=request, db=db)
