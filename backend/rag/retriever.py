import pickle
import faiss
import cohere
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from app.services.config import settings

MODELS_DIR = Path("../models")

class AgriRetriever:
    def __init__(self):
        self.model = None
        self.index = None
        self.chunks = None
        self.cohere_client = None
        self._loaded = False

    def load(self):
        if self._loaded:
            return
        print("Loading retriever...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        index_path = MODELS_DIR / "faiss_agri.index"
        metadata_path = MODELS_DIR / "faiss_metadata.pkl"

        if not index_path.exists():
            raise FileNotFoundError(
                "FAISS index not found. Run: python rag/build_index.py first"
            )

        self.index = faiss.read_index(str(index_path))
        with open(metadata_path, "rb") as f:
            self.chunks = pickle.load(f)

        if settings.COHERE_API_KEY:
            self.cohere_client = cohere.Client(settings.COHERE_API_KEY)

        self._loaded = True
        print(f"Retriever loaded. {self.index.ntotal} vectors indexed.")

    def retrieve(self, query: str, top_k: int = 5) -> list[dict]:
        self.load()
        query_embedding = self.model.encode([query])
        query_embedding = np.array(query_embedding).astype("float32")
        faiss.normalize_L2(query_embedding)

        scores, indices = self.index.search(query_embedding, min(top_k * 2, len(self.chunks)))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(self.chunks):
                chunk = self.chunks[idx].copy()
                chunk["score"] = float(score)
                results.append(chunk)

        if self.cohere_client and len(results) > 0:
            results = self._rerank(query, results, top_k)
        else:
            results = results[:top_k]

        return results

    def _rerank(self, query: str, results: list[dict], top_k: int) -> list[dict]:
        try:
            docs = [r["text"] for r in results]
            reranked = self.cohere_client.rerank(
                query=query,
                documents=docs,
                top_n=top_k,
                model="rerank-multilingual-v2.0"
            )
            reranked_results = []
            for item in reranked.results:
                result = results[item.index].copy()
                result["rerank_score"] = item.relevance_score
                reranked_results.append(result)
            return reranked_results
        except Exception as e:
            print(f"Reranking failed, using FAISS scores: {e}")
            return results[:top_k]

retriever = AgriRetriever()
