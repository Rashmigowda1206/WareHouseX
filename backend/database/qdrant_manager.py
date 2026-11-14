"""
WareHouseX Qdrant Vector Database Manager.
Primary persistent storage engine for WareHouseX inventory.
Provides high-performance vector storage, payload indexing, CRUD operations,
and duplicate prevention for warehouse inventory items.
"""
import os
import uuid
import logging
import threading
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from qdrant_client import QdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    PayloadSchemaType,
    PointIdsList,
)

from config import (
    QDRANT_STORAGE_PATH,
    QDRANT_URL,
    QDRANT_API_KEY,
    QDRANT_COLLECTION_NAME,
    VECTOR_DIMENSION,
)
from services.embedding_service import embedding_service

logger = logging.getLogger("warehousex.qdrant")

def compute_stock_status(quantity: int, minimum_stock: int) -> str:
    """Helper to determine stock level classification."""
    if quantity <= 0:
        return "Out of Stock"
    elif quantity <= minimum_stock:
        return "Low Stock"
    elif quantity > minimum_stock * 10:
        return "Overstocked"
    return "In Stock"

def item_id_to_uuid(item_id: str) -> str:
    """Deterministic UUID representation of application item_id for Qdrant point IDs."""
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(item_id).strip().upper()))

class DuplicateItemError(Exception):
    """Raised when attempting to insert an inventory item with an existing item_id."""
    pass

class ItemNotFoundError(Exception):
    """Raised when a requested inventory item does not exist."""
    pass

class QdrantManager:
    _instance = None
    _client: Optional[QdrantClient] = None
    _write_lock = threading.RLock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(QdrantManager, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        """Initializes the Qdrant client connection (Remote server or Local persistent disk)."""
        try:
            if QDRANT_URL:
                logger.info(f"[*] Connecting to remote Qdrant Vector Server at {QDRANT_URL}...")
                self._client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY, timeout=10.0)
            else:
                logger.info(f"[*] Initializing persistent Local Qdrant Storage at {QDRANT_STORAGE_PATH}...")
                self._client = QdrantClient(path=str(QDRANT_STORAGE_PATH))

            logger.info("[✓] Qdrant Client connection established successfully.")
            self.ensure_collection()
        except Exception as e:
            logger.error(f"[!] Qdrant connection failure: {e}", exc_info=True)
            self._client = None

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            self._init_client()
        if self._client is None:
            raise ConnectionError("Qdrant Vector Database is currently unreachable.")
        return self._client

    def is_alive(self) -> bool:
        """Checks if the Qdrant database is operational."""
        try:
            if self._client is None:
                return False
            # Check collection existence
            return self.client.collection_exists(QDRANT_COLLECTION_NAME)
        except Exception:
            return False

    def ensure_collection(self):
        """
        Ensures the warehouse_inventory collection exists with exact 384-dim Cosine configuration
        and payload indexes for required fields.
        """
        try:
            exists = self.client.collection_exists(QDRANT_COLLECTION_NAME)
            if not exists:
                logger.info(f"[*] Creating Qdrant collection '{QDRANT_COLLECTION_NAME}' (Cosine, dim={VECTOR_DIMENSION})...")
                self.client.create_collection(
                    collection_name=QDRANT_COLLECTION_NAME,
                    vectors_config=VectorParams(size=VECTOR_DIMENSION, distance=Distance.COSINE),
                )
                logger.info(f"[✓] Collection '{QDRANT_COLLECTION_NAME}' created successfully.")

            # Create required payload indexes
            indexed_fields = [
                "item_id",
                "SKU",
                "barcode",
                "category",
                "supplier",
                "warehouse_location",
                "status",
            ]
            for field in indexed_fields:
                try:
                    self.client.create_payload_index(
                        collection_name=QDRANT_COLLECTION_NAME,
                        field_name=field,
                        field_schema=PayloadSchemaType.KEYWORD,
                    )
                except Exception as ex:
                    logger.debug(f"Payload index notice for '{field}': {ex}")

        except Exception as e:
            logger.error(f"[!] Error ensuring Qdrant collection: {e}", exc_info=True)
            raise

    # ==========================================
    # CRUD Operations
    # ==========================================

    def add_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adds a new inventory item to Qdrant:
        - Validates unique item_id (enforcing duplicate prevention)
        - Thread-safe synchronization ensures race-free duplicate checking
        - Computes embedding vector using name, category, description
        - Stores vector and structured payload in Qdrant
        """
        raw_id = str(item_data.get("item_id") or item_data.get("product_id") or "").strip().upper()
        if not raw_id:
            raw_id = f"WHX-{uuid.uuid4().hex[:8].upper()}"

        item_name = str(item_data.get("item_name") or item_data.get("name") or "").strip()
        if not item_name:
            raise ValueError("item_name is required.")

        with self._write_lock:
            # Duplicate check by item_id
            point_id = item_id_to_uuid(raw_id)
            existing = self.get_item(raw_id)
            if existing:
                raise DuplicateItemError(f"Inventory item with item_id '{raw_id}' already exists in Qdrant.")

            category = str(item_data.get("category", "General")).strip()
            description = str(item_data.get("description", "")).strip() or f"{item_name} inventory asset"
            sku = str(item_data.get("SKU") or item_data.get("sku") or f"SKU-{raw_id}").strip().upper()
            barcode = str(item_data.get("barcode", "")).strip() or f"890{abs(hash(raw_id)) % 10000000000:010d}"
            quantity = int(item_data.get("quantity", 0))
            minimum_stock = int(item_data.get("minimum_stock") or item_data.get("reorder_point", 10))
            unit_price = float(item_data.get("unit_price", 0.0))
            supplier = str(item_data.get("supplier", "Unknown")).strip()
            warehouse_location = str(item_data.get("warehouse_location") or item_data.get("location_zone", "Zone A-01-A")).strip()
            
            now_iso = datetime.now(timezone.utc).isoformat()
            date_added = item_data.get("date_added", now_iso)
            last_updated = now_iso
            status = item_data.get("status") or compute_stock_status(quantity, minimum_stock)

            # Generate embedding vector
            embed_text = embedding_service.construct_item_text(
                name=item_name,
                category=category,
                description=description,
                sku=sku,
                location=warehouse_location
            )
            vector = embedding_service.embed_text(embed_text)

            payload = {
                "item_id": raw_id,
                "item_name": item_name,
                "SKU": sku,
                "barcode": barcode,
                "category": category,
                "description": description,
                "quantity": quantity,
                "minimum_stock": minimum_stock,
                "unit_price": round(unit_price, 2),
                "supplier": supplier,
                "warehouse_location": warehouse_location,
                "date_added": date_added,
                "last_updated": last_updated,
                "status": status,
                # Legacy backward-compatibility aliases
                "product_id": raw_id,
                "name": item_name,
                "sku": sku,
                "location_zone": warehouse_location,
                "reorder_point": minimum_stock,
                "stock_status": status,
            }

            point = PointStruct(
                id=point_id,
                vector=vector,
                payload=payload,
            )

            self.client.upsert(
                collection_name=QDRANT_COLLECTION_NAME,
                points=[point],
                wait=True,
            )

            logger.info(f"[✓] Item added to Qdrant: {raw_id} ('{item_name}')")
            return payload

    def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single inventory item by exact item_id or vector ID.
        """
        raw_id = str(item_id).strip().upper()
        point_id = item_id_to_uuid(raw_id)

        try:
            records = self.client.retrieve(
                collection_name=QDRANT_COLLECTION_NAME,
                ids=[point_id],
                with_payload=True,
                with_vectors=False,
            )
            if records and len(records) > 0:
                return records[0].payload
        except Exception as e:
            logger.debug(f"Direct ID lookup for {raw_id} missed: {e}")

        # Fallback query via payload filter in case point_id differs
        try:
            results = self.client.query_points(
                collection_name=QDRANT_COLLECTION_NAME,
                query_filter=Filter(
                    must=[FieldCondition(key="item_id", match=MatchValue(value=raw_id))]
                ),
                limit=1,
                with_payload=True,
            )
            if results.points and len(results.points) > 0:
                return results.points[0].payload
        except Exception as ex:
            logger.error(f"[!] Lookup error for {raw_id}: {ex}")

        return None

    def update_item(self, item_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates an existing inventory item:
        - Updates payload fields
        - Recomputes embedding vector if name, category, or description changed
        - Re-upserts point atomically
        """
        existing = self.get_item(item_id)
        if not existing:
            raise ItemNotFoundError(f"Item '{item_id}' not found in Qdrant inventory.")

        raw_id = existing["item_id"]
        point_id = item_id_to_uuid(raw_id)

        # Merge updates
        item_name = str(updates.get("item_name") or updates.get("name") or existing["item_name"]).strip()
        category = str(updates.get("category", existing["category"])).strip()
        description = str(updates.get("description", existing["description"])).strip()
        sku = str(updates.get("SKU") or updates.get("sku") or existing["SKU"]).strip().upper()
        barcode = str(updates.get("barcode", existing["barcode"])).strip()
        quantity = int(updates.get("quantity", existing["quantity"]))
        minimum_stock = int(updates.get("minimum_stock") or updates.get("reorder_point", existing["minimum_stock"]))
        unit_price = float(updates.get("unit_price", existing["unit_price"]))
        supplier = str(updates.get("supplier", existing["supplier"])).strip()
        warehouse_location = str(updates.get("warehouse_location") or updates.get("location_zone", existing["warehouse_location"])).strip()

        status = updates.get("status") or compute_stock_status(quantity, minimum_stock)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Check if vector recomputation is needed
        text_changed = (
            item_name != existing.get("item_name") or
            category != existing.get("category") or
            description != existing.get("description") or
            sku != existing.get("SKU") or
            warehouse_location != existing.get("warehouse_location")
        )

        if text_changed:
            embed_text = embedding_service.construct_item_text(
                name=item_name,
                category=category,
                description=description,
                sku=sku,
                location=warehouse_location
            )
            vector = embedding_service.embed_text(embed_text)
        else:
            # Fetch existing vector
            recs = self.client.retrieve(collection_name=QDRANT_COLLECTION_NAME, ids=[point_id], with_vectors=True)
            if recs and recs[0].vector:
                vector = recs[0].vector
            else:
                embed_text = embedding_service.construct_item_text(item_name, category, description, sku, warehouse_location)
                vector = embedding_service.embed_text(embed_text)

        payload = {
            "item_id": raw_id,
            "item_name": item_name,
            "SKU": sku,
            "barcode": barcode,
            "category": category,
            "description": description,
            "quantity": quantity,
            "minimum_stock": minimum_stock,
            "unit_price": round(unit_price, 2),
            "supplier": supplier,
            "warehouse_location": warehouse_location,
            "date_added": existing.get("date_added", now_iso),
            "last_updated": now_iso,
            "status": status,
            # Legacy compatibility
            "product_id": raw_id,
            "name": item_name,
            "sku": sku,
            "location_zone": warehouse_location,
            "reorder_point": minimum_stock,
            "stock_status": status,
        }

        point = PointStruct(
            id=point_id,
            vector=vector,
            payload=payload,
        )

        self.client.upsert(
            collection_name=QDRANT_COLLECTION_NAME,
            points=[point],
            wait=True,
        )

        logger.info(f"[✓] Item updated in Qdrant: {raw_id}")
        return payload

    def adjust_stock(self, item_id: str, delta: int) -> Dict[str, Any]:
        """Adjusts the stock quantity of an item directly."""
        existing = self.get_item(item_id)
        if not existing:
            raise ItemNotFoundError(f"Item '{item_id}' not found.")

        new_quantity = max(0, existing["quantity"] + delta)
        return self.update_item(item_id, {"quantity": new_quantity})

    def delete_item(self, item_id: str) -> bool:
        """Deletes an item by item_id from Qdrant."""
        existing = self.get_item(item_id)
        if not existing:
            return False

        point_id = item_id_to_uuid(existing["item_id"])
        self.client.delete(
            collection_name=QDRANT_COLLECTION_NAME,
            points_selector=PointIdsList(points=[point_id]),
            wait=True,
        )
        logger.info(f"[✓] Item deleted from Qdrant: {existing['item_id']}")
        return True

    def list_items(
        self,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_dir: str = "asc",
    ) -> Tuple[List[Dict[str, Any]], Optional[str], int]:
        """
        Lists inventory items from Qdrant with optional filtering.
        Returns (items, next_page_offset, total_count).
        """
        filter_conditions = []
        if category and category.lower() != "all":
            filter_conditions.append(FieldCondition(key="category", match=MatchValue(value=category)))
        if status and status.lower() != "all":
            filter_conditions.append(FieldCondition(key="status", match=MatchValue(value=status)))

        q_filter = Filter(must=filter_conditions) if filter_conditions else None

        # Scroll points from Qdrant
        records, next_offset = self.client.scroll(
            collection_name=QDRANT_COLLECTION_NAME,
            scroll_filter=q_filter,
            limit=limit,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        items = [r.payload for r in records if r.payload]

        # Optional client-side substring search filter if specified
        if search:
            s = search.lower().strip()
            items = [
                i for i in items
                if s in i.get("item_id", "").lower()
                or s in i.get("item_name", "").lower()
                or s in i.get("SKU", "").lower()
                or s in i.get("barcode", "").lower()
                or s in i.get("supplier", "").lower()
                or s in i.get("category", "").lower()
                or s in i.get("warehouse_location", "").lower()
            ]

        # Sorting
        if sort_by and items:
            key_map = {
                "id": "item_id",
                "product_id": "item_id",
                "item_id": "item_id",
                "name": "item_name",
                "item_name": "item_name",
                "category": "category",
                "quantity": "quantity",
                "unit_price": "unit_price",
                "status": "status",
                "stock_status": "status",
                "location_zone": "warehouse_location",
                "warehouse_location": "warehouse_location",
            }
            sort_field = key_map.get(sort_by, "item_id")
            reverse = sort_dir.lower() == "desc"
            items.sort(key=lambda x: (x.get(sort_field) is None, x.get(sort_field)), reverse=reverse)

        total_count = self.count_items()
        return items, next_offset, total_count

    def count_items(self) -> int:
        """Returns total point count in the inventory collection."""
        try:
            info = self.client.get_collection(QDRANT_COLLECTION_NAME)
            return info.points_count or 0
        except Exception:
            return 0

    def get_summary(self) -> Dict[str, Any]:
        """
        Computes warehouse summary metrics directly from Qdrant points:
        - Total Products
        - Total Quantity
        - Total Value ($)
        - Low Stock Count
        - Out of Stock Count
        - Category breakdown
        """
        # Fetch all points payload in chunks
        all_items = []
        next_offset = None
        while True:
            records, next_offset = self.client.scroll(
                collection_name=QDRANT_COLLECTION_NAME,
                limit=500,
                offset=next_offset,
                with_payload=True,
                with_vectors=False,
            )
            all_items.extend([r.payload for r in records if r.payload])
            if not next_offset:
                break

        total_products = len(all_items)
        total_quantity = sum(int(i.get("quantity", 0)) for i in all_items)
        total_value = sum(int(i.get("quantity", 0)) * float(i.get("unit_price", 0.0)) for i in all_items)
        low_stock = sum(1 for i in all_items if i.get("status") == "Low Stock")
        out_of_stock = sum(1 for i in all_items if i.get("status") == "Out of Stock")

        # Category breakdown
        cat_map: Dict[str, Dict[str, Any]] = {}
        for item in all_items:
            cat = item.get("category", "General")
            if cat not in cat_map:
                cat_map[cat] = {"count": 0, "quantity": 0, "value": 0.0}
            qty = int(item.get("quantity", 0))
            price = float(item.get("unit_price", 0.0))
            cat_map[cat]["count"] += 1
            cat_map[cat]["quantity"] += qty
            cat_map[cat]["value"] += qty * price

        categories_list = [
            {
                "category": k,
                "count": v["count"],
                "quantity": v["quantity"],
                "value": round(v["value"], 2),
            }
            for k, v in cat_map.items()
        ]

        return {
            "total_products": total_products,
            "total_quantity": total_quantity,
            "total_value": round(total_value, 2),
            "low_stock_count": low_stock,
            "out_of_stock_count": out_of_stock,
            "categories": categories_list,
        }

    def get_filter_values(self) -> Dict[str, List[str]]:
        """Returns unique categories, locations, suppliers, and statuses for UI filter dropdowns."""
        all_items = []
        next_offset = None
        while True:
            records, next_offset = self.client.scroll(
                collection_name=QDRANT_COLLECTION_NAME,
                limit=500,
                offset=next_offset,
                with_payload=True,
                with_vectors=False,
            )
            all_items.extend([r.payload for r in records if r.payload])
            if not next_offset:
                break

        categories = sorted(list({i.get("category") for i in all_items if i.get("category")}))
        locations = sorted(list({i.get("warehouse_location") for i in all_items if i.get("warehouse_location")}))
        suppliers = sorted(list({i.get("supplier") for i in all_items if i.get("supplier")}))
        statuses = ["In Stock", "Low Stock", "Out of Stock", "Overstocked"]

        return {
            "categories": categories,
            "warehouse_locations": locations,
            "suppliers": suppliers,
            "statuses": statuses,
        }

import atexit

def _cleanup_qdrant():
    """Ensures Qdrant storage locks are gracefully released on process termination."""
    try:
        if QdrantManager._instance and QdrantManager._instance._client is not None:
            QdrantManager._instance._client.close()
            QdrantManager._instance._client = None
    except Exception:
        pass

atexit.register(_cleanup_qdrant)

# Global singleton
qdrant_manager = QdrantManager()
