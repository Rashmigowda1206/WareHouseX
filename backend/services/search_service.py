"""
WareHouseX Intelligent Search Engine.
Powers exact-match lookup and dense semantic vector search via Qdrant.
Includes natural-language query intent extraction (e.g. auto-detecting 'low stock').
"""
import re
import logging
from typing import Dict, Any, List, Optional, Tuple

from qdrant_client.models import (
    Filter,
    FieldCondition,
    MatchValue,
    HasIdCondition,
)

from config import QDRANT_COLLECTION_NAME
from database.qdrant_manager import qdrant_manager, item_id_to_uuid
from services.embedding_service import embedding_service

logger = logging.getLogger("warehousex.search")

class SearchService:
    def __init__(self):
        self.qm = qdrant_manager

    def exact_search(self, query: str, search_type: str = "all") -> List[Dict[str, Any]]:
        """
        Exact match search for item_id, SKU, and barcode.
        NEVER relies on vector similarity for exact identification.
        """
        q = (query or "").strip().upper()
        if not q:
            return []

        conditions = []
        if search_type in ("item_id", "id", "product_id"):
            conditions.append(FieldCondition(key="item_id", match=MatchValue(value=q)))
        elif search_type in ("sku", "SKU"):
            conditions.append(FieldCondition(key="SKU", match=MatchValue(value=q)))
        elif search_type == "barcode":
            conditions.append(FieldCondition(key="barcode", match=MatchValue(value=q)))
        else:
            # Match any of the three
            q_filter = Filter(
                should=[
                    FieldCondition(key="item_id", match=MatchValue(value=q)),
                    FieldCondition(key="SKU", match=MatchValue(value=q)),
                    FieldCondition(key="barcode", match=MatchValue(value=q)),
                ]
            )

        if conditions:
            q_filter = Filter(must=conditions)

        try:
            results = self.qm.client.query_points(
                collection_name=QDRANT_COLLECTION_NAME,
                query_filter=q_filter,
                limit=10,
                with_payload=True,
            )
            matched = []
            for p in results.points:
                item = dict(p.payload)
                item["score"] = 1.0
                item["similarity_percent"] = "100%"
                item["match_type"] = "exact"
                matched.append(item)
            return matched
        except Exception as e:
            logger.error(f"[!] Exact search failed: {e}", exc_info=True)
            return []

    def semantic_search(
        self,
        query: str,
        category: Optional[str] = None,
        warehouse_location: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """
        Semantic vector search powered by Qdrant and FastEmbed embeddings.
        Converts queries to vector representations, executes Cosine nearest-neighbor
        retrieval, and applies structured metadata filtering.
        """
        raw_query = (query or "").strip()
        cleaned_query = raw_query
        auto_detected_filters: Dict[str, str] = {}

        # Natural language query parsing: detect stock status in query if not explicitly set
        if not status or status.lower() == "all":
            lower_q = raw_query.lower()
            if "low stock" in lower_q or "low on stock" in lower_q or "reorder" in lower_q:
                status = "Low Stock"
                auto_detected_filters["status"] = "Low Stock"
                cleaned_query = re.sub(r"\b(with\s+)?low(\s+on)?\s+stock\b", "", cleaned_query, flags=re.IGNORECASE).strip()
                cleaned_query = re.sub(r"\b(needing\s+)?reorder\b", "", cleaned_query, flags=re.IGNORECASE).strip()
            elif "out of stock" in lower_q or "zero stock" in lower_q or "depleted" in lower_q:
                status = "Out of Stock"
                auto_detected_filters["status"] = "Out of Stock"
                cleaned_query = re.sub(r"\b(with\s+)?out\s+of\s+stock\b", "", cleaned_query, flags=re.IGNORECASE).strip()
                cleaned_query = re.sub(r"\b(zero\s+stock|depleted)\b", "", cleaned_query, flags=re.IGNORECASE).strip()
            elif "in stock" in lower_q or "available" in lower_q:
                status = "In Stock"
                auto_detected_filters["status"] = "In Stock"
                cleaned_query = re.sub(r"\b(in\s+stock|available)\b", "", cleaned_query, flags=re.IGNORECASE).strip()

        # Build Qdrant metadata filters
        must_conditions = []
        if category and category.lower() != "all":
            must_conditions.append(FieldCondition(key="category", match=MatchValue(value=category)))
        if warehouse_location and warehouse_location.lower() != "all":
            must_conditions.append(FieldCondition(key="warehouse_location", match=MatchValue(value=warehouse_location)))
        if status and status.lower() != "all":
            must_conditions.append(FieldCondition(key="status", match=MatchValue(value=status)))

        q_filter = Filter(must=must_conditions) if must_conditions else None

        # Convert query to vector embedding
        query_text = cleaned_query if cleaned_query else raw_query
        query_vector = embedding_service.embed_text(query_text)

        try:
            # Query Qdrant with vector similarity + metadata filter
            search_response = self.qm.client.query_points(
                collection_name=QDRANT_COLLECTION_NAME,
                query=query_vector,
                query_filter=q_filter,
                limit=limit,
                offset=offset,
                with_payload=True,
            )

            results = []
            for point in search_response.points:
                score = round(float(point.score), 4)
                item = dict(point.payload)
                item["score"] = score
                # Cosine similarity range [-1, 1], convert to percentage
                similarity_pct = max(0.0, min(100.0, ((score + 1.0) / 2.0) * 100.0)) if score < 1.0 else 100.0
                item["similarity_percent"] = f"{similarity_pct:.1f}%"
                item["match_type"] = "semantic"
                results.append(item)

            return {
                "query": raw_query,
                "cleaned_query": cleaned_query,
                "auto_detected_filters": auto_detected_filters,
                "results": results,
                "count": len(results),
                "limit": limit,
                "offset": offset,
            }
        except Exception as e:
            logger.error(f"[!] Semantic vector search failed: {e}", exc_info=True)
            return {
                "query": raw_query,
                "error": str(e),
                "results": [],
                "count": 0,
            }

    def find_similar(self, item_id: str, limit: int = 6) -> List[Dict[str, Any]]:
        """
        Finds products semantically and structurally similar to a given item_id.
        Retrieves the item's embedding vector and queries nearest neighbors.
        """
        raw_id = str(item_id).strip().upper()
        target_uuid = item_id_to_uuid(raw_id)

        try:
            # Retrieve vector for the target item
            target_records = self.qm.client.retrieve(
                collection_name=QDRANT_COLLECTION_NAME,
                ids=[target_uuid],
                with_vectors=True,
                with_payload=True,
            )

            if not target_records or not target_records[0].vector:
                # If not found by UUID, try lookup and embed
                existing = self.qm.get_item(raw_id)
                if not existing:
                    return []
                text = embedding_service.construct_item_text(
                    existing["item_name"],
                    existing["category"],
                    existing["description"]
                )
                target_vector = embedding_service.embed_text(text)
            else:
                target_vector = target_records[0].vector

            # Search nearest neighbors excluding the item itself
            response = self.qm.client.query_points(
                collection_name=QDRANT_COLLECTION_NAME,
                query=target_vector,
                query_filter=Filter(
                    must_not=[FieldCondition(key="item_id", match=MatchValue(value=raw_id))]
                ),
                limit=limit,
                with_payload=True,
            )

            similar_items = []
            for p in response.points:
                score = round(float(p.score), 4)
                item = dict(p.payload)
                item["score"] = score
                similarity_pct = max(0.0, min(100.0, ((score + 1.0) / 2.0) * 100.0))
                item["similarity_percent"] = f"{similarity_pct:.1f}%"
                item["match_type"] = "similar"
                similar_items.append(item)

            return similar_items
        except Exception as e:
            logger.error(f"[!] Similar products search failed for {raw_id}: {e}", exc_info=True)
            return []

    def get_filters(self) -> Dict[str, Any]:
        """Returns available filter options from the Qdrant database."""
        return self.qm.get_filter_values()

# Global singleton
search_service = SearchService()
