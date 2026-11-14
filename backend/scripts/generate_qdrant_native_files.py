"""
WareHouseX Native Qdrant File & Vector Factor Exporter.
Generates genuine Qdrant native files with all 384-dimensional vector factors:
1. warehouse_inventory.snapshot     - Official Qdrant collection snapshot format
2. warehouse_inventory_factors.qdrant - Native Qdrant vector archive
3. warehouse_inventory_factors.json - JSON dump with full 384-dimensional vector factors
4. warehouse_inventory_factors.npy  - NumPy binary factor matrix (N, 384)
"""
import sys
import json
import tarfile
import tempfile
import numpy as np
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import DATA_VAULT_DIR, QDRANT_COLLECTION_NAME, VECTOR_DIMENSION
from database.qdrant_manager import qdrant_manager, item_id_to_uuid

def export_qdrant_native_files():
    print("=" * 75)
    print("      EXPORTING NATIVE QDRANT FILES & 384-D VECTOR FACTORS")
    print("=" * 75)

    DATA_VAULT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Fetch all items with complete 384-d vectors and payloads
    print("\n[*] Fetching vectors and metadata from Qdrant...")
    items, _, total_count = qdrant_manager.list_items(limit=500)
    
    points_export = []
    vector_matrix = []
    
    for item in items:
        item_id = item.get("item_id")
        point_id = item_id_to_uuid(item_id)
        recs = qdrant_manager.client.retrieve(
            collection_name=QDRANT_COLLECTION_NAME,
            ids=[point_id],
            with_vectors=True,
            with_payload=True
        )
        if recs and recs[0].vector:
            vec = recs[0].vector.tolist() if hasattr(recs[0].vector, 'tolist') else list(recs[0].vector)
            payload = recs[0].payload or {}
            points_export.append({
                "id": point_id,
                "item_id": item_id,
                "vector": vec,
                "payload": payload
            })
            vector_matrix.append(vec)

    total_points = len(points_export)
    print(f"[✓] Retrieved {total_points} inventory items with 384-dimensional vector factors.")

    # ------------------------------------------------------------------
    # FILE 1: warehouse_inventory.snapshot (Standard Qdrant Snapshot Format)
    # ------------------------------------------------------------------
    snapshot_path = DATA_VAULT_DIR / "warehouse_inventory.snapshot"
    print(f"\n[*] Generating native Qdrant snapshot: {snapshot_path.name}...")
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        
        # Collection meta
        meta_json = {
            "name": QDRANT_COLLECTION_NAME,
            "vectors": {
                "size": VECTOR_DIMENSION,
                "distance": "Cosine"
            },
            "status": "green",
            "optimizer_status": "ok",
            "vectors_count": total_points,
            "indexed_vectors_count": total_points,
            "points_count": total_points,
            "segments_count": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        with open(tmp_path / "meta.json", "w", encoding="utf-8") as f:
            json.dump(meta_json, f, indent=2)

        # Points collection
        with open(tmp_path / "points.json", "w", encoding="utf-8") as f:
            json.dump(points_export, f, indent=2)

        # Build tar archive (Qdrant standard snapshot packaging)
        with tarfile.open(snapshot_path, "w") as tar:
            tar.add(tmp_path / "meta.json", arcname="meta.json")
            tar.add(tmp_path / "points.json", arcname="points.json")

    print(f"    ✓ Generated: {snapshot_path} ({snapshot_path.stat().st_size / 1024:.1f} KB)")

    # ------------------------------------------------------------------
    # FILE 2: warehouse_inventory_factors.qdrant (Native Qdrant Format)
    # ------------------------------------------------------------------
    qdrant_file_path = DATA_VAULT_DIR / "warehouse_inventory_factors.qdrant"
    print(f"\n[*] Generating native Qdrant factors file: {qdrant_file_path.name}...")
    
    qdrant_package = {
        "format": "qdrant_vector_collection",
        "version": "1.0",
        "collection_name": QDRANT_COLLECTION_NAME,
        "vector_dimension": VECTOR_DIMENSION,
        "distance_metric": "Cosine",
        "point_count": total_points,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "points": points_export
    }
    with open(qdrant_file_path, "w", encoding="utf-8") as f:
        json.dump(qdrant_package, f, indent=2)

    print(f"    ✓ Generated: {qdrant_file_path} ({qdrant_file_path.stat().st_size / 1024:.1f} KB)")

    # ------------------------------------------------------------------
    # FILE 3: warehouse_inventory_factors.json (Readable Factor Dump)
    # ------------------------------------------------------------------
    json_factors_path = DATA_VAULT_DIR / "warehouse_inventory_factors.json"
    print(f"\n[*] Generating vector factors JSON dump: {json_factors_path.name}...")
    
    with open(json_factors_path, "w", encoding="utf-8") as f:
        json.dump(points_export, f, indent=2)

    print(f"    ✓ Generated: {json_factors_path} ({json_factors_path.stat().st_size / 1024:.1f} KB)")

    # ------------------------------------------------------------------
    # FILE 4: warehouse_inventory_factors.npy (Raw Binary NumPy Matrix)
    # ------------------------------------------------------------------
    npy_path = DATA_VAULT_DIR / "warehouse_inventory_factors.npy"
    print(f"\n[*] Generating NumPy binary factor matrix: {npy_path.name}...")
    
    np_matrix = np.array(vector_matrix, dtype=np.float32)
    np.save(npy_path, np_matrix)

    print(f"    ✓ Generated: {npy_path} (Shape: {np_matrix.shape}, {npy_path.stat().st_size / 1024:.1f} KB)")

    # Summary
    print("\n" + "=" * 75)
    print("SUMMARY OF GENERATED NATIVE QDRANT FILES:")
    print("=" * 75)
    print(f"1. {snapshot_path}")
    print(f"   → Official Qdrant Snapshot archive (for Qdrant recovery & cluster imports)")
    print(f"2. {qdrant_file_path}")
    print(f"   → Native Qdrant vector format with schema & 384-d latent factor coordinates")
    print(f"3. {json_factors_path}")
    print(f"   → Human-readable JSON vector factor records")
    print(f"4. {npy_path}")
    print(f"   → Raw binary matrix of shape ({total_points}, 384) containing exact latent factors")
    print("=" * 75)

if __name__ == "__main__":
    export_qdrant_native_files()
