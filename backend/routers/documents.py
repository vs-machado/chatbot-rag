from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import json
import uuid

from database import get_db
from schemas.document import (
    DocumentListResponse, 
    DocumentSearchRequest, 
    DocumentSearchResponse,
    UploadResponse,
    ModelConfig
)
from services import document_service

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["documents"],
    responses={404: {"description": "Documento não encontrado"}},
)


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    model_config: Optional[str] = Form(None, description="JSON string com ModelConfig"),
    chunk_size: Optional[int] = Form(None),
    chunk_overlap: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Faz upload de um arquivo (PDF, DOCX, TXT), processa e gera embeddings.
    """
    parsed_config = None
    if model_config:
        try:
            config_dict = json.loads(model_config)
            parsed_config = ModelConfig(**config_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro ao processar model_config: {str(e)}")

    try:
        created_docs = document_service.process_and_create_documents_from_file(
            db=db,
            file=file,
            chunk_size=chunk_size or 1000, # Default value se None
            chunk_overlap=chunk_overlap or 200, # Default value se None
            model_config=parsed_config
        )
        
        return UploadResponse(
            message=f"Arquivo processado com sucesso. {len(created_docs)} chunks criados.",
            documents_created=len(created_docs),
            document_ids=[doc.id for doc in created_docs]
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Lista todos os documentos armazenados."""
    docs = document_service.list_documents(db, skip=skip, limit=limit)
    # Assumindo contagem total simples para este exemplo. Em produção usar count query.
    # Como list_documents pode não retornar tudo, a paginação real requer count.
    # Vou adicionar uma query de count simples.
    from models import Document
    total = db.query(Document).count()
    
    return DocumentListResponse(
        documents=docs,
        total=total,
        page=(skip // limit) + 1,
        page_size=limit
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Remove um documento pelo ID."""
    success = document_service.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Documento não encontrado")


@router.post("/search", response_model=DocumentSearchResponse)
def search_documents(
    request: DocumentSearchRequest,
    db: Session = Depends(get_db)
):
    """Busca semântica nos documentos."""
    try:
        results = document_service.search_documents(
            db=db,
            query=request.query,
            top_k=request.top_k,
            model_config=request.model_config_
        )
        
        return DocumentSearchResponse(
            results=results,
            query=request.query,
            total=len(results)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}")
