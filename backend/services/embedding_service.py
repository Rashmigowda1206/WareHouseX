"""
WareHouseX Vector Embedding Service.
Converts warehouse inventory items and search queries into normalized 384-dimensional dense vectors
using FastEmbed (BAAI/bge-small-en-v1.5) with graceful fallback.
"""
import os
import math
import hashlib
import logging
from typing import List, Union
from config import EMBEDDING_MODEL_NAME, VECTOR_DIMENSION

logger = logging.getLogger("warehousex.embedding")

class EmbeddingService:
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance

    def _get_model(self):
        if self._model is None:
            try:
                # Suppress HF symlinks warning on Windows
                os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
                from fastembed import TextEmbedding
                logger.info(f"[*] Initializing FastEmbed model '{EMBEDDING_MODEL_NAME}' (dim={VECTOR_DIMENSION})...")
                self._model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
                logger.info("[✓] FastEmbed TextEmbedding engine active and ready.")
            except Exception as e:
                logger.error(f"[!] Failed to load FastEmbed model: {e}. Falling back to deterministic dense embedding.", exc_info=True)
                self._model = None
        return self._model

    @staticmethod
    def construct_item_text(name: str, category: str, description: str, sku: str = "", location: str = "") -> str:
        """
        Standardizes product representation for embedding generation:
        Uses product name, category, and description as primary semantic signals.
        """
        parts = [f"Product: {name.strip()}"]
        if category:
            parts.append(f"Category: {category.strip()}")
        if description:
            parts.append(f"Description: {description.strip()}")
        if sku:
            parts.append(f"SKU: {sku.strip()}")
        if location:
            parts.append(f"Location: {location.strip()}")
        return " | ".join(parts)

    def _fallback_vector(self, text: str, dim: int = VECTOR_DIMENSION) -> List[float]:
        """
        Deterministic pseudo-semantic dense vector fallback in case of hardware or network failures.
        Ensures the system never crashes on embedding failures.
        """
        tokens = text.lower().split()
        vec = [0.0] * dim
        for i, token in enumerate(tokens):
            h = int(hashlib.sha256(token.encode('utf-8')).hexdigest(), 16)
            for j in range(dim):
                slot_hash = (h + (j * 31) + (i * 7)) % 10007
                vec[j] += math.sin(slot_hash)
        # Normalize to unit length for cosine distance
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        else:
            vec = [1.0 / math.sqrt(dim)] * dim
        return vec

    def embed_text(self, text: str) -> List[float]:
        """
        Embed a single text string into a 384-dimensional unit vector.
        """
        text = (text or "").strip()
        if not text:
            return [0.0] * VECTOR_DIMENSION

        model = self._get_model()
        if model is not None:
            try:
                embeddings = list(model.embed([text]))
                if embeddings and len(embeddings) > 0:
                    vec = embeddings[0].tolist() if hasattr(embeddings[0], 'tolist') else list(embeddings[0])
                    return [float(x) for x in vec]
            except Exception as e:
                logger.warning(f"[!] FastEmbed inference error: {e}. Using resilient fallback vector.")

        return self._fallback_vector(text)

    def embed_batch(self, texts: List[str], batch_size: int = 128) -> List[List[float]]:
        """
        Embed a batch of texts efficiently.
        """
        if not texts:
            return []

        cleaned = [(t or "").strip() for t in texts]
        model = self._get_model()

        if model is not None:
            try:
                results = []
                for i in range(0, len(cleaned), batch_size):
                    chunk = cleaned[i:i + batch_size]
                    batch_embeds = list(model.embed(chunk))
                    for item in batch_embeds:
                        vec = item.tolist() if hasattr(item, 'tolist') else list(item)
                        results.append([float(x) for x in vec])
                return results
            except Exception as e:
                logger.warning(f"[!] FastEmbed batch error: {e}. Falling back to sequential safe embeddings.")

        return [self._fallback_vector(t) for t in cleaned]

# Global singleton
embedding_service = EmbeddingService()
