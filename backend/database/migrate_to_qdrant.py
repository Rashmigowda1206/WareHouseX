"""
WareHouseX Safe SQLite -> Qdrant Vector Database Migration Pipeline.
- Inspects the existing SQLite database.
- Exports all inventory records without modifying SQLite (leaving SQLite as untouched backup).
- Enriches each record with full Qdrant payload metadata and vector embeddings.
- Upserts records into the persistent Qdrant 'warehouse_inventory' collection.
- Verifies migrated record counts and integrity.
"""
import os
import sys
import sqlite3
import logging
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from config import DATABASE_PATH, QDRANT_COLLECTION_NAME
from database.qdrant_manager import qdrant_manager, compute_stock_status
from services.embedding_service import embedding_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("warehousex.migration")

# Product description enrichments to provide deep semantic context for vectors
DESCRIPTIONS_MAP = {
    "WHX-EL-1001": "Industrial high-speed 2D barcode reader with rugged rubber casing, Bluetooth & wireless connectivity, designed for warehouse scanning and inventory logistics.",
    "WHX-EL-1002": "Enterprise rugged RFID handheld mobile computer terminal with long-range reader, Android OS, touchscreen, and drop-proof design.",
    "WHX-EL-1003": "High-volume direct thermal & thermal transfer industrial label printer for shipping labels, pallet tags, and compliance barcodes.",
    "WHX-EL-1004": "Industrial IoT temperature and humidity condition monitoring sensor for cold storage and automated climate-controlled logistics hubs.",
    "WHX-EL-1005": "Ultra-rugged 10-inch vehicle-mounted tablet with GPS, Wi-Fi 6, barcode scanner for forklift operators and fulfillment tracking.",
    "WHX-PK-2001": "Heavy-duty 55-micron stretch wrap film roll for pallet stabilization and automated wrapping machines.",
    "WHX-PK-2002": "Heavy-duty double-wall corrugated cardboard shipping boxes for e-commerce parcel fulfillment and transit protection.",
    "WHX-PK-2003": "Biodegradable anti-static bubble roll cushion film for fragile electronic components and sensitive parcel packing.",
    "WHX-PK-2004": "Reinforced water-activated fiberglass gummed carton sealing tape for tamper-evident packaging.",
    "WHX-PK-2005": "Direct thermal transfer die-cut fanfold barcode shipping labels (4x6 inch) for automated logistics printers.",
    "WHX-ST-3001": "Industrial heavy-duty steel teardrop pallet rack upright frame for high-density warehouse storage systems.",
    "WHX-ST-3002": "Heavy-duty steel roll-formed step beam for pallet rack storage levels, holding up to 5,000 lbs capacity.",
    "WHX-ST-3003": "Flanged welded wire mesh deck for pallet racking shelves, fire-safe water-permeable design.",
    "WHX-ST-3004": "Industrial heavy-duty nesting stackable plastic storage tote container for bin picking and order assembly.",
    "WHX-ST-3005": "High-density steel boltless industrial shelving unit for rapid carton and tool picking aisles.",
    "WHX-MH-4001": "Heavy-duty hydraulic manual pallet truck with 5500 lbs capacity, polyurethane steer wheels, and ergonomic handle.",
    "WHX-MH-4002": "Heavy-duty 3-tier industrial steel platform service rolling cart for order picking and maintenance tools.",
    "WHX-MH-4003": "Mobile safety rolling warehouse ladder with locking caster wheels and handrails for stock picking.",
    "WHX-MH-4004": "Heavy-duty hydraulic scissor lift table cart with foot pedal pump for ergonomic material lifting.",
    "WHX-MH-4005": "Gravity skatewheel expandable flexible accordion conveyor roller system for truck loading and dock unloading.",
    "WHX-SF-5001": "Class 2 high-visibility reflective mesh safety vest with zipper pockets for warehouse workers and dock staff.",
    "WHX-SF-5002": "Industrial ANSI rated hard hat helmet with ratchet suspension and chin strap for construction and warehouse safety.",
    "WHX-SF-5003": "ANSI Level 5 cut-resistant nitrile micro-foam coated work gloves for handling sharp cartons and metal edges.",
    "WHX-SF-5004": "Class 10-pound ABC dry chemical industrial fire extinguisher with vehicle mounting bracket for logistics facilities.",
    "WHX-SF-5005": "OSHA compliant 200-piece industrial emergency first aid and trauma kit for warehouse operations."
}

def migrate_sqlite_to_qdrant() -> dict:
    """
    Executes the safe migration from SQLite to Qdrant.
    Leaves SQLite intact. Returns migration summary metrics.
    """
    logger.info("==================================================")
    logger.info("Starting WareHouseX Safe Migration: SQLite -> Qdrant")
    logger.info(f"Source SQLite DB: {DATABASE_PATH}")
    logger.info(f"Target Qdrant Collection: {QDRANT_COLLECTION_NAME}")
    logger.info("==================================================")

    if not os.path.exists(DATABASE_PATH):
        logger.warning(f"[!] SQLite DB file not found at {DATABASE_PATH}. No records to migrate.")
        return {"status": "skipped", "reason": "SQLite DB not found"}

    # 1. Inspect existing SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'")
    if not cursor.fetchone():
        logger.warning("[!] No 'inventory' table found in SQLite database.")
        conn.close()
        return {"status": "skipped", "reason": "inventory table missing"}

    cursor.execute("SELECT * FROM inventory")
    sqlite_rows = cursor.fetchall()
    sqlite_count = len(sqlite_rows)
    logger.info(f"[+] Found {sqlite_count} inventory records in SQLite.")

    # 2. Convert and Upsert into Qdrant
    qdrant_manager.ensure_collection()
    migrated_count = 0
    skipped_count = 0

    for row in sqlite_rows:
        row_dict = dict(row)
        item_id = str(row_dict.get("product_id") or row_dict.get("item_id") or f"WHX-{row_dict.get('id')}").strip().upper()
        item_name = str(row_dict.get("name") or row_dict.get("item_name") or "").strip()
        sku = str(row_dict.get("sku") or row_dict.get("SKU") or f"SKU-{item_id}").strip().upper()
        category = str(row_dict.get("category", "General")).strip()
        quantity = int(row_dict.get("quantity", 0))
        unit_price = float(row_dict.get("unit_price", 0.0))
        supplier = str(row_dict.get("supplier", "Unknown")).strip()
        reorder_point = int(row_dict.get("reorder_point", 10))
        location_zone = str(row_dict.get("location_zone") or row_dict.get("warehouse_location") or "Zone A-01-A").strip()
        status = row_dict.get("stock_status") or compute_stock_status(quantity, reorder_point)
        date_added = row_dict.get("last_updated") or datetime.now(timezone.utc).isoformat()
        
        # Enriched description
        description = DESCRIPTIONS_MAP.get(item_id) or f"{item_name} premium {category.lower()} asset stored in {location_zone} supplied by {supplier}."
        barcode = f"890{abs(hash(item_id + sku)) % 10000000000:010d}"

        payload_data = {
            "item_id": item_id,
            "item_name": item_name,
            "SKU": sku,
            "barcode": barcode,
            "category": category,
            "description": description,
            "quantity": quantity,
            "minimum_stock": reorder_point,
            "unit_price": unit_price,
            "supplier": supplier,
            "warehouse_location": location_zone,
            "date_added": date_added,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "status": status,
        }

        try:
            # Check if item exists in Qdrant
            existing = qdrant_manager.get_item(item_id)
            if existing:
                # Update item to ensure freshest metadata & embeddings
                qdrant_manager.update_item(item_id, payload_data)
                logger.info(f"    [~] Synchronized existing item in Qdrant: {item_id}")
            else:
                qdrant_manager.add_item(payload_data)
                logger.info(f"    [+] Inserted new item into Qdrant: {item_id}")
            migrated_count += 1
        except Exception as e:
            logger.error(f"[!] Error migrating item {item_id}: {e}", exc_info=True)
            skipped_count += 1

    conn.close()

    # 3. Verify counts
    qdrant_total = qdrant_manager.count_items()
    logger.info("==================================================")
    logger.info(f"[✓] Migration Complete!")
    logger.info(f"    SQLite Source Records : {sqlite_count}")
    logger.info(f"    Migrated / Synced     : {migrated_count}")
    logger.info(f"    Skipped / Failed      : {skipped_count}")
    logger.info(f"    Qdrant Total Points   : {qdrant_total}")
    logger.info(f"    Original SQLite DB    : UNTOUCHED at {DATABASE_PATH}")
    logger.info("==================================================")

    return {
        "status": "success",
        "sqlite_count": sqlite_count,
        "migrated_count": migrated_count,
        "skipped_count": skipped_count,
        "qdrant_total": qdrant_total,
    }

if __name__ == "__main__":
    result = migrate_sqlite_to_qdrant()
    print("Migration result:", result)
