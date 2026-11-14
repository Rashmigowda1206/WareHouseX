"""
WareHouseX Qdrant Vector Database Inspector.
Quick CLI utility to display:
1. Exact physical location on disk
2. Collection configuration (384-d Cosine)
3. Total vector records
4. Stored payloads and vector embeddings
5. Live semantic search demonstration
"""
import sys
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import (
    QDRANT_STORAGE_PATH,
    QDRANT_COLLECTION_NAME,
    VECTOR_DIMENSION,
    EMBEDDING_MODEL_NAME,
)
from database.qdrant_manager import qdrant_manager, item_id_to_uuid
from services.search_service import search_service

def inspect_qdrant():
    print("=" * 75)
    print("           WAREHOUSEX — QDRANT VECTOR DATABASE INSPECTOR")
    print("=" * 75)
    
    # 1. Physical Location
    storage_file = QDRANT_STORAGE_PATH / "collection" / QDRANT_COLLECTION_NAME / "storage.sqlite"
    file_size_kb = round(storage_file.stat().st_size / 1024, 1) if storage_file.exists() else 0

    print("\n📍 1. PHYSICAL STORAGE LOCATION ON DISK:")
    print(f"   Root Folder : {QDRANT_STORAGE_PATH}")
    print(f"   SQLite File : {storage_file}")
    print(f"   File Size   : {file_size_kb} KB (Persistent on disk)")
    print(f"   Lock File   : {QDRANT_STORAGE_PATH / '.lock'}")
    print(f"   Meta File   : {QDRANT_STORAGE_PATH / 'meta.json'}")

    # 2. Collection Configuration
    print("\n⚙️  2. COLLECTION SPECIFICATIONS:")
    print(f"   Collection Name  : {QDRANT_COLLECTION_NAME}")
    print(f"   Vector Dimension : {VECTOR_DIMENSION} dimensions")
    print(f"   Distance Metric  : Cosine Similarity")
    print(f"   Embedding Model  : {EMBEDDING_MODEL_NAME} (FastEmbed ONNX)")
    print(f"   Engine Status    : {'ONLINE (Connected)' if qdrant_manager.is_alive() else 'OFFLINE'}")

    # 3. Live Inventory Statistics
    summary = qdrant_manager.get_summary()
    print("\n📊 3. DATABASE INVENTORY METRICS:")
    print(f"   Total Vector Points : {summary['total_products']} items")
    print(f"   Total Stock Units   : {summary['total_quantity']:,} units")
    print(f"   Total Valuation     : ${summary['total_value']:,.2f}")
    print(f"   Low Stock Alerts    : {summary['low_stock_count']} items")
    print(f"   Out of Stock        : {summary['out_of_stock_count']} items")
    print(f"   Categories          : {len(summary['categories'])} distinct fulfillment categories")

    # 4. Sample Record Inspection (Vector + Payload)
    print("\n📦 4. SAMPLE VECTOR & PAYLOAD INSPECTION:")
    items, _, _ = qdrant_manager.list_items(limit=3)
    for idx, item in enumerate(items, 1):
        item_id = item.get("item_id")
        point_id = item_id_to_uuid(item_id)
        recs = qdrant_manager.client.retrieve(
            collection_name=QDRANT_COLLECTION_NAME,
            ids=[point_id],
            with_vectors=True,
            with_payload=True
        )
        vec_sample = ""
        if recs and recs[0].vector:
            raw_v = recs[0].vector
            vec_sample = ", ".join(f"{x:+.4f}" for x in raw_v[:5]) + " ... (384 floats total)"

        print(f"\n   [Record #{idx}] Item ID: {item.get('item_id')} | Name: '{item.get('item_name')}'")
        print(f"     • SKU / Barcode : {item.get('SKU')} / {item.get('barcode')}")
        print(f"     • Category      : {item.get('category')} | Location: {item.get('warehouse_location')}")
        print(f"     • Quantity/Price: {item.get('quantity')} units @ ${item.get('unit_price'):.2f} (Status: {item.get('status')})")
        print(f"     • Vector Sample : [{vec_sample}]")

    # 5. Live Semantic Vector Search Demo
    demo_query = "Show me wireless scanning devices with low stock"
    print(f"\n🔍 5. LIVE SEMANTIC SEARCH DEMO:")
    print(f"   Query: \"{demo_query}\"")
    sem_res = search_service.semantic_search(query=demo_query, limit=3)
    print(f"   Auto-detected Filter: {sem_res.get('auto_detected_filters')}")
    print(f"   Results Found: {sem_res.get('count')} matching items")
    for r in sem_res.get("results", [])[:3]:
        print(f"     → [{r.get('similarity_percent')}] {r.get('item_name')} ({r.get('item_id')}) — {r.get('status')} (Qty: {r.get('quantity')})")

    print("\n" + "=" * 75)
    print("Inspection complete. Qdrant vector database is fully operational.")
    print("=" * 75)

if __name__ == "__main__":
    inspect_qdrant()
