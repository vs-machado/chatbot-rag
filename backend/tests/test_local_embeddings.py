import os
import sys
import time
import types
import unittest
from concurrent.futures import ThreadPoolExecutor

from services.local_embeddings import LocalEmbeddingProcess, _embedding_worker


class FakeArray:
    def __init__(self, value):
        self.value = value

    def tolist(self):
        return self.value


class FakeTransformer:
    def __init__(self, model_name, trust_remote_code):
        self.prompts = {"query": "query prompt"} if model_name.startswith("qwen/") else {}

    def encode(self, texts, **options):
        def vector(text):
            if text == "error":
                raise ValueError("erro simulado")
            if text == "slow":
                time.sleep(0.3)
            return [os.getpid(), len(text), int(options.get("prompt_name") == "query")]

        return FakeArray(
            [vector(text) for text in texts] if isinstance(texts, list) else vector(texts)
        )


class FakeSplitter:
    def __init__(self, chunk_size, chunk_overlap, length_function):
        self.chunk_size = chunk_size

    def split_text(self, text):
        return [text[: self.chunk_size], text[self.chunk_size :]]


def fake_worker(connection, model_name):
    module = types.ModuleType("sentence_transformers")
    module.SentenceTransformer = FakeTransformer
    sys.modules["sentence_transformers"] = module
    splitter_module = types.ModuleType("langchain_text_splitters")
    splitter_module.RecursiveCharacterTextSplitter = FakeSplitter
    sys.modules["langchain_text_splitters"] = splitter_module
    _embedding_worker(connection, model_name)


def crash_worker(connection, model_name):
    os._exit(1)


class LocalEmbeddingProcessTests(unittest.TestCase):
    def manager(self, **settings):
        manager = LocalEmbeddingProcess(worker_target=fake_worker, **settings)
        self.addCleanup(manager.close)
        return manager

    def test_import_and_construction_do_not_load_model(self):
        manager = self.manager()
        self.assertIsNone(manager._process)
        self.assertNotIn("torch", sys.modules)
        self.assertNotIn("sentence_transformers", sys.modules)

    def test_preserves_single_batch_and_query_prompt(self):
        manager = self.manager()
        single = manager.encode("qwen/test", "abc", True)
        self.assertEqual(single[1:], [3, 1])
        self.assertEqual(
            manager.encode("qwen/test", ["ab", "c"]),
            [[single[0], 2, 0], [single[0], 1, 0]],
        )
        self.assertEqual(manager.encode("other/test", "abc", True)[1:], [3, 0])

    def test_concurrent_requests_share_one_process(self):
        manager = self.manager()
        with ThreadPoolExecutor(max_workers=4) as executor:
            vectors = list(executor.map(lambda _: manager.encode("test", "abc"), range(4)))
        self.assertEqual(len({vector[0] for vector in vectors}), 1)
        self.assertNotEqual(vectors[0][0], os.getpid())

    def test_chunking_runs_in_child_without_importing_splitters_in_parent(self):
        manager = self.manager()
        self.assertEqual(manager.split_text("abcdef", 3, 0), ["abc", "def"])
        self.assertNotIn("langchain_text_splitters", sys.modules)

    def test_idle_exit_and_next_request_reload(self):
        manager = self.manager(idle_timeout=0.15)
        first = manager.encode("test", "abc")
        process = manager._process
        deadline = time.monotonic() + 5
        while manager._process is not None and time.monotonic() < deadline:
            time.sleep(0.02)
        self.assertIsNone(manager._process)
        self.assertTrue(process._closed)
        self.assertNotEqual(manager.encode("test", "abc")[0], first[0])

    def test_idle_timer_does_not_interrupt_inflight_or_newer_request(self):
        manager = self.manager(idle_timeout=0.15)
        first = manager.encode("test", "abc")
        generation = manager._generation
        self.assertEqual(manager.encode("test", "slow")[0], first[0])
        manager._expire(generation)
        self.assertTrue(manager._process.is_alive())
        self.assertEqual(manager.encode("test", "abc")[0], first[0])

    def test_model_switch_reaps_previous_process(self):
        manager = self.manager()
        first = manager.encode("first", "abc")
        old_process = manager._process
        second = manager.encode("second", "abc")
        self.assertNotEqual(first[0], second[0])
        self.assertTrue(old_process._closed)

    def test_encode_error_keeps_worker_usable(self):
        manager = self.manager()
        with self.assertRaisesRegex(RuntimeError, "erro simulado"):
            manager.encode("test", "error")
        self.assertEqual(manager.encode("test", "abc")[1:], [3, 0])

    def test_timeout_reaps_process_and_allows_restart(self):
        manager = self.manager()
        manager.encode("test", "abc")
        manager._request_timeout = 0.1
        with self.assertRaises(TimeoutError):
            manager.encode("test", "slow")
        self.assertIsNone(manager._process)
        manager._request_timeout = 10
        self.assertEqual(manager.encode("test", "abc")[1:], [3, 0])

    def test_worker_crash_cleans_up(self):
        manager = LocalEmbeddingProcess(worker_target=crash_worker, request_timeout=5)
        self.addCleanup(manager.close)
        with self.assertRaises((EOFError, RuntimeError, OSError)):
            manager.encode("test", "abc")
        self.assertIsNone(manager._process)

    def test_close_is_idempotent_and_releases_worker(self):
        manager = self.manager()
        manager.encode("test", "abc")
        process = manager._process
        manager.close()
        manager.close()
        self.assertTrue(process._closed)
        self.assertIsNone(manager._timer)


if __name__ == "__main__":
    unittest.main()
