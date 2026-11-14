"""
WareHouseX 10,000 Synthetic Record Performance Benchmark.
Strict requirement: Run real tests and report genuine measurements without fabrication.
Measures:
1. 10,000 record generation & vector upsert throughput
2. Exact item_id/SKU/barcode lookup latency
3. Semantic vector similarity search latency with metadata filtering
4. Pagination performance across deep offsets
5. Concurrent query throughput (8 worker threads, 100 requests)
"""
import os
import sys
import time
import random
import statistics
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from config import QDRANT_STORAGE_PATH, VECTOR_DIMENSION

CATEGORIES = ["Electronics", "Machinery", "Packaging", "Safety Gear", "IT Hardware", "Raw Materials", "Automotive", "Sensors"]
SUPPLIERS = ["OmniSupply Corp", "Apex Industrial", "LogiTech Dynamics", "Titan Logistics", "Global Core Parts", "Vanguard Systems"]
ZONES = [f"Zone {chr(65+i)}-{j:02d}-{chr(65+k)}" for i in range(6) for j in range(1, 10) for k in range(3)]
STATUSES = ["In Stock", "In Stock", "In Stock", "Low Stock", "Out of Stock", "Overstocked"]

BENCHMARK_COLLECTION = "warehouse_inventory_10k"

def run_benchmark():
    print("=" * 65)
    print("WAREHOUSEX 10,000 RECORD QDRANT BENCHMARK")
    print(f"Target Collection : {BENCHMARK_COLLECTION}")
    print(f"Storage Path      : {QDRANT_STORAGE_PATH}")
    print(f"Vector Dimension  : {VECTOR_DIMENSION} (Cosine)")
    print("=" * 65)

    client = QdrantClient(path=str(QDRANT_STORAGE_PATH))

    # 1. Setup Collection
    if client.collection_exists(BENCHMARK_COLLECTION):
        client.delete_collection(BENCHMARK_COLLECTION)

    client.create_collection(
        collection_name=BENCHMARK_COLLECTION,
        vectors_config=VectorParams(size=VECTOR_DIMENSION, distance=Distance.COSINE),
    )

    # 2. Ingest 10,000 Synthetic Records in Batches
    print("\n[PHASE 1] Generating & Upserting 10,000 Synthetic Inventory Records...")
    TOTAL_RECORDS = 10000
    BATCH_SIZE = 500

    # Generate synthetic items and pre-normalized vectors
    random.seed(42)
    start_ingest = time.time()
    all_sample_ids = []
    all_sample_skus = []

    for b in range(0, TOTAL_RECORDS, BATCH_SIZE):
        batch_points = []
        for i in range(b + 1, b + BATCH_SIZE + 1):
            item_id = f"WHX-SYN-{i:05d}"
            sku = f"SKU-SYN-{i:05d}"
            barcode = f"890{i:010d}"
            cat = random.choice(CATEGORIES)
            qty = random.randint(0, 500)
            status = "Out of Stock" if qty == 0 else ("Low Stock" if qty < 15 else "In Stock")
            loc = random.choice(ZONES)
            supp = random.choice(SUPPLIERS)
            price = round(random.uniform(5.0, 2500.0), 2)

            # Generate random normalized 384-d vector
            raw_v = [random.gauss(0, 1) for _ in range(VECTOR_DIMENSION)]
            norm = sum(x*x for x in raw_v) ** 0.5
            norm_v = [x/norm for x in raw_v]

            payload = {
                "item_id": item_id,
                "item_name": f"Synthetic {cat} Component Unit #{i}",
                "SKU": sku,
                "barcode": barcode,
                "category": cat,
                "description": f"Automated logistics asset #{i} under category {cat} located at {loc} supplied by {supp}.",
                "quantity": qty,
                "minimum_stock": 15,
                "unit_price": price,
                "supplier": supp,
                "warehouse_location": loc,
                "status": status,
            }

            batch_points.append(PointStruct(id=i, vector=norm_v, payload=payload))

            if i % 1000 == 0:
                all_sample_ids.append(item_id)
                all_sample_skus.append(sku)

        client.upsert(collection_name=BENCHMARK_COLLECTION, points=batch_points, wait=True)
        print(f"  Ingested batch {b + BATCH_SIZE} / {TOTAL_RECORDS} points...")

    ingest_time = time.time() - start_ingest
    points_per_sec = TOTAL_RECORDS / ingest_time
    print(f"  ✓ Ingestion complete: 10,000 points in {ingest_time:.2f}s ({points_per_sec:.1f} records/sec)")

    # 3. Exact Search Benchmark (50 iterations)
    print("\n[PHASE 2] Benchmarking Exact Search (Item ID & SKU lookup)...")
    exact_latencies = []
    test_queries = [f"WHX-SYN-{random.randint(1, TOTAL_RECORDS):05d}" for _ in range(50)]

    for q in test_queries:
        t0 = time.perf_counter()
        res = client.query_points(
            collection_name=BENCHMARK_COLLECTION,
            query_filter=Filter(must=[FieldCondition(key="item_id", match=MatchValue(value=q))]),
            limit=1,
            with_payload=True
        )
        elapsed = (time.perf_counter() - t0) * 1000.0  # ms
        exact_latencies.append(elapsed)

    print(f"  P50 Latency : {statistics.median(exact_latencies):.2f} ms")
    print(f"  Avg Latency : {statistics.mean(exact_latencies):.2f} ms")
    print(f"  Min Latency : {min(exact_latencies):.2f} ms")
    print(f"  Max Latency : {max(exact_latencies):.2f} ms")

    # 4. Semantic Vector Search Benchmark (50 iterations)
    print("\n[PHASE 3] Benchmarking Semantic Vector Search (Cosine Nearest Neighbors + Category Filter)...")
    semantic_latencies = []
    for _ in range(50):
        # Random query vector
        raw_v = [random.gauss(0, 1) for _ in range(VECTOR_DIMENSION)]
        norm = sum(x*x for x in raw_v) ** 0.5
        q_vec = [x/norm for x in raw_v]
        cat = random.choice(CATEGORIES)

        t0 = time.perf_counter()
        res = client.query_points(
            collection_name=BENCHMARK_COLLECTION,
            query=q_vec,
            query_filter=Filter(must=[FieldCondition(key="category", match=MatchValue(value=cat))]),
            limit=20,
            with_payload=True
        )
        elapsed = (time.perf_counter() - t0) * 1000.0
        semantic_latencies.append(elapsed)

    print(f"  P50 Latency : {statistics.median(semantic_latencies):.2f} ms")
    print(f"  Avg Latency : {statistics.mean(semantic_latencies):.2f} ms")
    print(f"  Min Latency : {min(semantic_latencies):.2f} ms")
    print(f"  Max Latency : {max(semantic_latencies):.2f} ms")

    # 5. Pagination Benchmark (Deep offsets)
    print("\n[PHASE 4] Benchmarking Pagination at Deep Offsets...")
    offsets = [0, 100, 500, 1000, 2500, 5000, 8000]
    for off in offsets:
        t0 = time.perf_counter()
        # Scroll with limit=25
        pts, next_off = client.scroll(
            collection_name=BENCHMARK_COLLECTION,
            limit=25,
            offset=off,
            with_payload=True,
            with_vectors=False
        )
        ms = (time.perf_counter() - t0) * 1000.0
        print(f"  Offset {off:5d} -> Retrieved {len(pts)} items in {ms:.2f} ms")

    # 6. Concurrent Queries Benchmark (8 Worker Threads, 100 queries)
    print("\n[PHASE 5] Benchmarking Concurrent Requests (8 Threads, 100 Queries)...")
    def worker_task(i):
        raw_v = [random.gauss(0, 1) for _ in range(VECTOR_DIMENSION)]
        norm = sum(x*x for x in raw_v) ** 0.5
        q_vec = [x/norm for x in raw_v]
        t0 = time.perf_counter()
        res = client.query_points(
            collection_name=BENCHMARK_COLLECTION,
            query=q_vec,
            limit=10,
            with_payload=True
        )
        return (time.perf_counter() - t0) * 1000.0

    t_concurrent_start = time.time()
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(worker_task, i) for i in range(100)]
        concurrent_times = [f.result() for f in as_completed(futures)]
    total_concurrent_time = time.time() - t_concurrent_start
    qps = 100.0 / total_concurrent_time

    print(f"  Processed 100 concurrent queries in {total_concurrent_time:.2f}s")
    print(f"  Throughput  : {qps:.1f} queries/sec (QPS)")
    print(f"  Avg Latency : {statistics.mean(concurrent_times):.2f} ms")
    print(f"  P95 Latency : {statistics.quantiles(concurrent_times, n=20)[18]:.2f} ms")

    # Clean up benchmark collection
    client.delete_collection(BENCHMARK_COLLECTION)
    client.close()

    print("\n" + "=" * 65)
    print("BENCHMARK COMPLETED SUCCESSFULLY (10,000 RECORDS)")
    print("=" * 65)

    return {
        "ingest_time_seconds": round(ingest_time, 2),
        "ingest_rate": round(points_per_sec, 1),
        "exact_p50_ms": round(statistics.median(exact_latencies), 2),
        "semantic_p50_ms": round(statistics.median(semantic_latencies), 2),
        "concurrent_qps": round(qps, 1),
    }

if __name__ == "__main__":
    run_benchmark()
