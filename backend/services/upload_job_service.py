import threading
import uuid
from datetime import datetime, timezone
from typing import Any


_jobs_lock = threading.Lock()
_jobs: dict[uuid.UUID, dict[str, Any]] = {}


def create_upload_job(filename: str) -> dict[str, Any]:
    """Cria um job de upload em memória."""
    job_id = uuid.uuid4()
    job = {
        "job_id": job_id,
        "filename": filename,
        "status": "queued",
        "message": "Upload enfileirado.",
        "progress_percentage": 0,
        "total_chunks": 0,
        "processed_chunks": 0,
        "documents_created": 0,
        "document_ids": [],
        "error": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    with _jobs_lock:
        _jobs[job_id] = job

    return job.copy()


def update_upload_job(job_id: uuid.UUID, **updates: Any) -> dict[str, Any] | None:
    """Atualiza um job de upload em memória."""
    with _jobs_lock:
        job = _jobs.get(job_id)
        if job is None:
            return None

        job.update(updates)
        job["updated_at"] = datetime.now(timezone.utc)
        return job.copy()


def get_upload_job(job_id: uuid.UUID) -> dict[str, Any] | None:
    """Busca um job de upload pelo ID."""
    with _jobs_lock:
        job = _jobs.get(job_id)
        return job.copy() if job else None
