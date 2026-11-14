"""
WareHouseX Inventory Module.
Powered by Qdrant Vector Database as primary inventory data storage.
Provides high-performance vector-embedded CRUD, stock adjustments, valuation,
and category telemetry with complete audit logging.
"""
from flask import Blueprint, request, jsonify, g, Response
import io
import csv
import logging
from database.db import get_db
from database.qdrant_manager import (
    qdrant_manager,
    DuplicateItemError,
    ItemNotFoundError,
    compute_stock_status,
)
from modules.auth import token_required, role_required

logger = logging.getLogger("warehousex.inventory")
inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.route("", methods=["GET"])
@token_required
def get_inventory():
    """
    List inventory items directly from Qdrant with optional filtering and sorting.
    """
    category = request.args.get("category")
    status = request.args.get("status")
    search = request.args.get("search", "").strip()
    sort_by = request.args.get("sort_by", "item_id")
    sort_dir = request.args.get("sort_dir", "asc").lower()
    limit = int(request.args.get("limit", 500))
    offset = request.args.get("offset")

    items, next_offset, total_count = qdrant_manager.list_items(
        category=category,
        status=status,
        search=search,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )

    return jsonify({
        "items": items,
        "count": len(items),
        "total": total_count,
        "next_offset": next_offset,
        "storage": "qdrant_vector_database"
    }), 200

@inventory_bp.route("/<path:item_id>", methods=["GET"])
@token_required
def get_product(item_id: str):
    """
    Retrieve a single product from Qdrant by item_id or SKU.
    """
    item = qdrant_manager.get_item(item_id)
    if not item:
        return jsonify({"error": f"Product '{item_id}' not found in Qdrant"}), 404
    return jsonify({"item": item}), 200

@inventory_bp.route("/summary", methods=["GET"])
@token_required
def get_inventory_summary():
    """
    Aggregates warehouse valuation, stock alerts, and category breakdown directly from Qdrant.
    Orders telemetry is queried from SQLite orders table.
    """
    summary = qdrant_manager.get_summary()

    # Query orders from SQLite orders table
    with get_db() as conn:
        orders = conn.execute("SELECT total_amount, status FROM orders").fetchall()

    total_orders = len(orders)
    total_order_revenue = sum(float(o["total_amount"]) for o in orders)
    pending_orders = sum(1 for o in orders if o["status"] == "pending")

    return jsonify({
        "total_products": summary["total_products"],
        "total_quantity": summary["total_quantity"],
        "total_value": summary["total_value"],
        "low_stock_count": summary["low_stock_count"],
        "out_of_stock_count": summary["out_of_stock_count"],
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "total_revenue": round(total_order_revenue, 2),
        "categories": summary["categories"],
        "primary_database": "Qdrant Vector Database"
    }), 200

@inventory_bp.route("/categories", methods=["GET"])
@token_required
def get_categories():
    """
    Returns unique product categories from Qdrant.
    """
    filters = qdrant_manager.get_filter_values()
    return jsonify({"categories": filters.get("categories", [])}), 200

@inventory_bp.route("", methods=["POST"])
@token_required
@role_required(["admin", "manager", "owner", "OWNER", "WAREHOUSE_MANAGER", "INVENTORY_STAFF"])
def add_product():
    """
    Adds a new item into Qdrant:
    - Generates vector embedding via FastEmbed
    - Enforces duplicate prevention on item_id
    - Records audit log in activity_logs
    """
    data = request.get_json(silent=True) or {}
    item_id = str(data.get("item_id") or data.get("product_id") or "").strip().upper()
    name = str(data.get("item_name") or data.get("name") or "").strip()

    if not name:
        return jsonify({"error": "Product name is required"}), 400

    try:
        new_item = qdrant_manager.add_item(data)
        client_ip = request.remote_addr or "127.0.0.1"

        with get_db() as conn:
            conn.execute(
                "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    g.current_user["user_id"],
                    g.current_user["username"],
                    "QDRANT_ITEM_ADDED",
                    "inventory",
                    f"Added vector item {new_item['item_id']} - {new_item['item_name']} ({new_item['quantity']} units)",
                    "info",
                    client_ip
                )
            )

        return jsonify({
            "message": "Product successfully added to Qdrant vector database",
            "item": new_item,
            "item_id": new_item["item_id"],
            "product_id": new_item["item_id"],
            "id": new_item["item_id"]
        }), 201

    except DuplicateItemError as de:
        return jsonify({"error": str(de)}), 409
    except Exception as e:
        logger.error(f"[!] Error adding product to Qdrant: {e}", exc_info=True)
        return jsonify({"error": f"Failed to store item in Qdrant: {str(e)}"}), 500

@inventory_bp.route("/<path:item_id>", methods=["PUT"])
@token_required
@role_required(["admin", "manager", "owner", "OWNER", "WAREHOUSE_MANAGER", "INVENTORY_STAFF"])
def update_product(item_id: str):
    """
    Updates an existing inventory item in Qdrant.
    Re-embeds vector if name, category, or description changed.
    """
    data = request.get_json(silent=True) or {}

    try:
        updated_item = qdrant_manager.update_item(item_id, data)
        client_ip = request.remote_addr or "127.0.0.1"

        with get_db() as conn:
            conn.execute(
                "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    g.current_user["user_id"],
                    g.current_user["username"],
                    "QDRANT_ITEM_UPDATED",
                    "inventory",
                    f"Updated vector item {updated_item['item_id']} ({updated_item['item_name']})",
                    "info",
                    client_ip
                )
            )

        return jsonify({
            "message": "Product updated successfully in Qdrant",
            "item": updated_item
        }), 200

    except ItemNotFoundError as ne:
        return jsonify({"error": str(ne)}), 404
    except Exception as e:
        logger.error(f"[!] Error updating product {item_id}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to update product in Qdrant: {str(e)}"}), 500

@inventory_bp.route("/<path:item_id>/adjust-stock", methods=["POST"])
@token_required
def adjust_stock(item_id: str):
    """
    Adjusts the stock level of an item directly in Qdrant.
    """
    data = request.get_json(silent=True) or {}
    delta = int(data.get("delta", 0))
    reason = str(data.get("reason", "Inventory cycle count adjustment")).strip()

    if delta == 0:
        return jsonify({"message": "No adjustment made (delta was 0)"}), 200

    try:
        updated_item = qdrant_manager.adjust_stock(item_id, delta)
        client_ip = request.remote_addr or "127.0.0.1"

        with get_db() as conn:
            conn.execute(
                "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    g.current_user["user_id"],
                    g.current_user["username"],
                    "QDRANT_STOCK_ADJUSTED",
                    "inventory",
                    f"Adjusted stock for {updated_item['item_id']}: delta {delta} (now {updated_item['quantity']}). Reason: {reason}",
                    "info",
                    client_ip
                )
            )

        return jsonify({
            "message": f"Stock adjusted to {updated_item['quantity']}",
            "new_quantity": updated_item["quantity"],
            "stock_status": updated_item["status"],
            "item": updated_item
        }), 200

    except ItemNotFoundError as ne:
        return jsonify({"error": str(ne)}), 404
    except Exception as e:
        logger.error(f"[!] Error adjusting stock for {item_id}: {e}", exc_info=True)
        return jsonify({"error": f"Stock adjustment failed: {str(e)}"}), 500

@inventory_bp.route("/<path:item_id>", methods=["DELETE"])
@token_required
@role_required(["admin", "manager", "owner", "OWNER", "WAREHOUSE_MANAGER"])
def delete_product(item_id: str):
    """
    Deletes an inventory item from Qdrant vector database.
    """
    try:
        deleted = qdrant_manager.delete_item(item_id)
        if not deleted:
            return jsonify({"error": f"Product '{item_id}' not found in Qdrant"}), 404

        client_ip = request.remote_addr or "127.0.0.1"
        with get_db() as conn:
            conn.execute(
                "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    g.current_user["user_id"],
                    g.current_user["username"],
                    "QDRANT_ITEM_DELETED",
                    "inventory",
                    f"Deleted vector item {item_id} from Qdrant",
                    "warning",
                    client_ip
                )
            )

        return jsonify({"message": f"Product '{item_id}' deleted successfully from Qdrant"}), 200

    except Exception as e:
        logger.error(f"[!] Error deleting product {item_id}: {e}", exc_info=True)
        return jsonify({"error": f"Failed to delete product from Qdrant: {str(e)}"}), 500

@inventory_bp.route("/export", methods=["GET"])
@token_required
@role_required(["admin", "owner", "OWNER", "manager", "WAREHOUSE_MANAGER"])
def export_inventory():
    """
    Exports all Qdrant inventory records as CSV or JSON.
    """
    fmt = request.args.get("format", "csv").lower()
    items, _, _ = qdrant_manager.list_items(limit=10000)

    if fmt == "json":
        return jsonify({"inventory": items, "count": len(items)}), 200

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Item ID", "Product Name", "SKU", "Barcode", "Category",
        "Quantity", "Minimum Stock", "Unit Price", "Supplier",
        "Warehouse Location", "Date Added", "Last Updated", "Status"
    ])
    for i in items:
        writer.writerow([
            i.get("item_id"),
            i.get("item_name"),
            i.get("SKU"),
            i.get("barcode"),
            i.get("category"),
            i.get("quantity"),
            i.get("minimum_stock"),
            i.get("unit_price"),
            i.get("supplier"),
            i.get("warehouse_location"),
            i.get("date_added"),
            i.get("last_updated"),
            i.get("status"),
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=warehousex_qdrant_inventory.csv"}
    )
