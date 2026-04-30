"""Controllers para gerenciamento de documentos."""

import json
import uuid
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, UploadFile
from sqlalchemy.orm import Session

from models import Document
from schemas.document import (
    DocumentListResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
    UploadJobStatusResponse,
    ModelConfig,
    UploadResponse,
)
from services import document_service
from services.upload_job_service import create_upload_job, get_upload_job


async def upload_document_controller(
    file: UploadFile,
    model_configuration: Optional[str],
    chunk_size: Optional[int],
    chunk_overlap: Optional[int],
    background_tasks: BackgroundTasks,
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
        file_bytes = await file.read()
        job = create_upload_job(file.filename or "arquivo")
        background_tasks.add_task(
            document_service.process_and_create_documents_in_background,
            job["job_id"],
            file.filename or "arquivo",
            file.content_type,
            file_bytes,
            chunk_size or 1000,
            chunk_overlap or 200,
            parsed_config,
        )

        return UploadResponse(
            message="Upload recebido. Processamento iniciado em background.",
            status="queued",
            job_id=job["job_id"],
            documents_created=0,
            document_ids=[],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}") from e


def get_upload_job_status_controller(job_id: uuid.UUID) -> UploadJobStatusResponse:
    """Retorna o status de um job de upload."""
    job = get_upload_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job de upload não encontrado")

    return UploadJobStatusResponse(**job)


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


def process_document_temporarily(file: UploadFile) -> dict:
    """Controller para processar documento temporariamente.

    Extrai o texto do arquivo sem persistir no banco de dados.
    Usado para anexar arquivos a mensagens de chat sem salvar na base.
    """
    try:
        content = document_service.extract_text_from_file(file)

        return {
            "filename": file.filename,
            "content": content,
            "content_type": file.content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {str(e)}") from e
