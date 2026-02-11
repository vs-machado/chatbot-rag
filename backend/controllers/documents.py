"""Controllers para gerenciamento de documentos."""

import json
import uuid
from typing import Optional

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from models import Document
from schemas.document import (
    DocumentListResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
    ModelConfig,
    UploadResponse,
)
from services import document_service


async def upload_document_controller(
    file: UploadFile,
    model_configuration: Optional[str],
    chunk_size: Optional[int],
    chunk_overlap: Optional[int],
    db: Session,
) -> UploadResponse:
    """Controller para upload de documentos.

    Faz upload de um arquivo (PDF, DOCX, TXT), processa e gera embeddings.
    """
    parsed_config = None
    if model_configuration:
        try:
            config_dict = json.loads(model_configuration)
            parsed_config = ModelConfig(**config_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro ao processar model_config: {str(e)}") from e

    try:
        created_docs = document_service.process_and_create_documents_from_file(
            db=db,
            file=file,
            chunk_size=chunk_size or 1000,
            chunk_overlap=chunk_overlap or 200,
            model_config=parsed_config,
        )

        return UploadResponse(
            message=f"Arquivo processado com sucesso. {len(created_docs)} chunks criados.",
            documents_created=len(created_docs),
            document_ids=[doc.id for doc in created_docs],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}") from e


def list_documents_controller(skip: int, limit: int, db: Session) -> DocumentListResponse:
    """Controller para listar documentos.

    Lista todos os documentos armazenados com paginação.
    """
    docs = document_service.list_documents(db, skip=skip, limit=limit)
    total = db.query(Document).count()

    return DocumentListResponse(
        documents=docs, total=total, page=(skip // limit) + 1, page_size=limit
    )


def delete_document_controller(document_id: uuid.UUID, db: Session) -> None:
    """Controller para deletar documento.

    Remove um documento pelo ID.
    """
    success = document_service.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Documento não encontrado")


def search_documents_controller(
    request: DocumentSearchRequest, db: Session
) -> DocumentSearchResponse:
    """Controller para busca semântica.

    Realiza busca semântica nos documentos.
    """
    try:
        results = document_service.search_documents(
            db=db, query=request.query, top_k=request.top_k, model_config=request.model_config_
        )

        return DocumentSearchResponse(results=results, query=request.query, total=len(results))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}") from e
