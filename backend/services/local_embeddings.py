"""Isola inferência local em processo descartável, sem importar PyTorch na API."""

import atexit
import logging
import multiprocessing
import threading
import time

from config import (
    EMBEDDING_IDLE_TIMEOUT_SECONDS,
    EMBEDDING_MODEL,
    EMBEDDING_REQUEST_TIMEOUT_SECONDS,
)

logger = logging.getLogger(__name__)


def _embedding_worker(connection, model_name: str) -> None:
    """Carrega um modelo no processo filho e preserva prompts e formato dos vetores."""
    try:
        model = None
        while True:
            operation, payload = connection.recv()
            try:
                if operation == "split":
                    from langchain_text_splitters import RecursiveCharacterTextSplitter

                    text, chunk_size, chunk_overlap = payload
                    splitter = RecursiveCharacterTextSplitter(
                        chunk_size=chunk_size, chunk_overlap=chunk_overlap, length_function=len
                    )
                    connection.send((True, splitter.split_text(text)))
                    continue
                texts, is_query = payload
                if model is None:
                    from sentence_transformers import SentenceTransformer

                    model = SentenceTransformer(
                        model_name, trust_remote_code=model_name.lower().startswith("qwen/")
                    )
                options = {"convert_to_numpy": True}
                if is_query and "query" in (getattr(model, "prompts", None) or {}):
                    options["prompt_name"] = "query"
                connection.send((True, model.encode(texts, **options).tolist()))
            except Exception as exc:
                connection.send((False, str(exc)))
    except EOFError:
        pass
    except Exception as exc:
        connection.send((False, str(exc)))
    finally:
        connection.close()


class LocalEmbeddingProcess:
    """Serializa inferências e encerra o filho após inatividade ou falha de transporte."""

    def __init__(
        self,
        idle_timeout: float = EMBEDDING_IDLE_TIMEOUT_SECONDS,
        request_timeout: float = EMBEDDING_REQUEST_TIMEOUT_SECONDS,
        worker_target=_embedding_worker,
    ) -> None:
        if idle_timeout <= 0 or request_timeout <= 0:
            raise ValueError("Os tempos de embeddings devem ser positivos.")
        self._idle_timeout = idle_timeout
        self._request_timeout = request_timeout
        self._worker_target = worker_target
        self._context = multiprocessing.get_context("spawn")
        self._lock = threading.Lock()
        self._process = None
        self._connection = None
        self._model_name = None
        self._timer = None
        self._generation = 0

    def encode(
        self, model_name: str, texts: str | list[str], is_query: bool = False
    ) -> list[float] | list[list[float]]:
        """Inicia sob demanda; aguarda resposta com prazo e nunca encerra envio em andamento."""
        return self._request(model_name, "encode", (texts, is_query))

    def split_text(self, text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
        """Divide documentos sem importar dependências de inferência na API."""
        return self._request(EMBEDDING_MODEL, "split", (text, chunk_size, chunk_overlap))

    def _request(self, model_name: str, operation: str, payload):
        with self._lock:
            self._generation += 1
            if self._timer is not None:
                self._timer.cancel()
                self._timer = None
            try:
                if (
                    self._process is None
                    or not self._process.is_alive()
                    or self._model_name != model_name
                ):
                    self._stop_locked()
                    self._start_locked(model_name)
                self._connection.send((operation, payload))
                deadline = time.monotonic() + self._request_timeout
                while not self._connection.poll(0.1):
                    if not self._process.is_alive():
                        raise RuntimeError("Processo de embeddings encerrou sem resposta.")
                    if time.monotonic() >= deadline:
                        raise TimeoutError("Tempo limite excedido ao gerar embeddings locais.")
                success, result = self._connection.recv()
            except (OSError, EOFError, TimeoutError, RuntimeError):
                self._stop_locked()
                raise
            finally:
                if self._process is not None:
                    self._timer = threading.Timer(
                        self._idle_timeout, self._expire, args=(self._generation,)
                    )
                    self._timer.daemon = True
                    self._timer.start()
            if not success:
                raise RuntimeError(f"Falha ao gerar embeddings locais: {result}")
            return result

    def close(self) -> None:
        """Libera processo, conexão e timer no encerramento da aplicação."""
        with self._lock:
            self._generation += 1
            self._stop_locked()

    def _start_locked(self, model_name: str) -> None:
        parent, child = self._context.Pipe()
        process = self._context.Process(
            target=self._worker_target, args=(child, model_name), daemon=True
        )
        try:
            process.start()
        except Exception:
            parent.close()
            raise
        finally:
            child.close()
        self._process = process
        self._connection = parent
        self._model_name = model_name
        logger.info("Processo de embeddings iniciado sob demanda: %s", model_name)

    def _stop_locked(self) -> None:
        if self._timer is not None:
            self._timer.cancel()
            self._timer = None
        if self._process is not None:
            if self._process.is_alive():
                self._process.terminate()
            self._process.join(timeout=5)
            if self._process.is_alive():
                self._process.kill()
                self._process.join(timeout=5)
            self._process.close()
            self._process = None
        if self._connection is not None:
            self._connection.close()
            self._connection = None
        self._model_name = None

    def _expire(self, generation: int) -> None:
        with self._lock:
            if generation == self._generation:
                self._stop_locked()
                logger.info("Processo de embeddings encerrado por inatividade")


local_embeddings = LocalEmbeddingProcess()
atexit.register(local_embeddings.close)
