from flask import Blueprint, request, jsonify, g, Response
import io
import csv
from database.db import get_db
from modules.auth import token_required, role_required

inventory_bp = Blueprint("inventory", __name__)

def compute_stock_status(quantity: int, reorder_point: int) -> str:
    if quantity <= 0:
        return "Out of Stock"
    elif quantity <= reorder_point:
        return "Low Stock"
    elif quantity > reorder_point * 10:
        return "Overstocked"
    return "In Stock"

@inventory_bp.route("", methods=["GET"])
@token_required
def get_inventory():
    category = request.args.get("category")
    status = request.args.get("status")
    search = request.args.get("search", "").strip()
    sort_by = request.args.get("sort_by", "id")
    sort_dir = request.args.get("sort_dir", "asc").upper()

    allowed_sort = {"id", "product_id", "name", "category", "quantity", "unit_price", "stock_status", "location_zone"}
    if sort_by not in allowed_sort:
        sort_by = "id"
    if sort_dir not in ("ASC", "DESC"):
        sort_dir = "ASC"

    query = "SELECT * FROM inventory WHERE 1=1"
    params = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
    if status and status != "all":
        query += " AND stock_status = ?"
        params.append(status)
    if search:
        query += " AND (product_id LIKE ? OR name LIKE ? OR sku LIKE ? OR supplier LIKE ? OR location_zone LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term, term, term])

    query += f" ORDER BY {sort_by} {sort_dir}"

    with get_db() as conn:
        items = conn.execute(query, params).fetchall()

    return jsonify({"items": items, "count": len(items)}), 200

@inventory_bp.route("/summary", methods=["GET"])
@token_required
def get_inventory_summary():
    with get_db() as conn:
        items = conn.execute("SELECT category, quantity, unit_price, stock_status FROM inventory").fetchall()
        orders = conn.execute("SELECT total_amount, status FROM orders").fetchall()

    total_products = len(items)
    total_quantity = sum(i["quantity"] for i in items)
    total_value = sum(i["quantity"] * i["unit_price"] for i in items)
    low_stock = sum(1 for i in items if i["stock_status"] == "Low Stock")
    out_of_stock = sum(1 for i in items if i["stock_status"] == "Out of Stock")

    # Category breakdown
    categories_dict = {}
    for i in items:
        cat = i["category"]
        if cat not in categories_dict:
            categories_dict[cat] = {"count": 0, "value": 0.0, "quantity": 0}
        categories_dict[cat]["count"] += 1
        categories_dict[cat]["value"] += i["quantity"] * i["unit_price"]
        categories_dict[cat]["quantity"] += i["quantity"]

    categories_list = [
        {"category": k, "count": v["count"], "value": round(v["value"], 2), "quantity": v["quantity"]}
        for k, v in categories_dict.items()
    ]

    total_orders = len(orders)
    total_order_revenue = sum(o["total_amount"] for o in orders)

    return jsonify({
        "total_products": total_products,
        "total_quantity": total_quantity,
        "total_value": round(total_value, 2),
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "total_orders": total_orders,
        "total_revenue": round(total_order_revenue, 2),
        "categories": categories_list
    }), 200

@inventory_bp.route("/categories", methods=["GET"])
@token_required
def get_categories():
    with get_db() as conn:
        cats = conn.execute("SELECT DISTINCT category FROM inventory ORDER BY category ASC").fetchall()
    return jsonify({"categories": [c["category"] for c in cats]}), 200

@inventory_bp.route("", methods=["POST"])
@token_required
@role_required(["admin", "manager"])
def add_product():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id", "").strip().upper()
    name = data.get("name", "").strip()
    category = data.get("category", "General").strip()
    quantity = int(data.get("quantity", 0))
    unit_price = float(data.get("unit_price", 0.0))
    supplier = data.get("supplier", "Unknown").strip()
    reorder_point = int(data.get("reorder_point", 10))
    location_zone = data.get("location_zone", "Unassigned").strip()
    sku = data.get("sku", "").strip().upper() or f"SKU-{product_id}"

    if not product_id or not name:
        return jsonify({"error": "Product ID and Name are required"}), 400

    stock_status = compute_stock_status(quantity, reorder_point)
    client_ip = request.remote_addr or "127.0.0.1"

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM inventory WHERE product_id = ? OR sku = ?", (product_id, sku)).fetchone()
        if existing:
            return jsonify({"error": f"Product with ID '{product_id}' or SKU '{sku}' already exists"}), 409

        cursor = conn.execute("""
            INSERT INTO inventory (product_id, name, category, quantity, unit_price, supplier, stock_status, reorder_point, location_zone, sku)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (product_id, name, category, quantity, unit_price, supplier, stock_status, reorder_point, location_zone, sku))

        new_id = cursor.lastrowid

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "PRODUCT_ADDED", "inventory", f"Added item {product_id} - {name} ({quantity} units @ ${unit_price:.2f})", "info", client_ip)
        )

    return jsonify({"message": "Product added successfully", "id": new_id, "product_id": product_id}), 201

@inventory_bp.route("/<int:item_id>", methods=["PUT"])
@token_required
@role_required(["admin", "manager"])
def update_product(item_id: int):
    data = request.get_json(silent=True) or {}

    with get_db() as conn:
        item = conn.execute("SELECT * FROM inventory WHERE id = ?", (item_id,)).fetchone()
        if not item:
            return jsonify({"error": "Product record not found"}), 404

        name = data.get("name", item["name"]).strip()
        category = data.get("category", item["category"]).strip()
        quantity = int(data.get("quantity", item["quantity"]))
        unit_price = float(data.get("unit_price", item["unit_price"]))
        supplier = data.get("supplier", item["supplier"]).strip()
        reorder_point = int(data.get("reorder_point", item["reorder_point"]))
        location_zone = data.get("location_zone", item["location_zone"]).strip()
        sku = data.get("sku", item["sku"]).strip().upper()

        stock_status = compute_stock_status(quantity, reorder_point)

        conn.execute("""
            UPDATE inventory
            SET name = ?, category = ?, quantity = ?, unit_price = ?, supplier = ?,
                stock_status = ?, reorder_point = ?, location_zone = ?, sku = ?, last_updated = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (name, category, quantity, unit_price, supplier, stock_status, reorder_point, location_zone, sku, item_id))

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "PRODUCT_UPDATED", "inventory", f"Updated product {item['product_id']} ({name})", "info", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": "Product updated successfully"}), 200

@inventory_bp.route("/<int:item_id>/adjust-stock", methods=["POST"])
@token_required
def adjust_stock(item_id: int):
    data = request.get_json(silent=True) or {}
    delta = int(data.get("delta", 0))
    reason = data.get("reason", "Standard cycle count adjustment").strip()

    if delta == 0:
        return jsonify({"message": "No adjustment made (delta was 0)"}), 200

    with get_db() as conn:
        item = conn.execute("SELECT * FROM inventory WHERE id = ?", (item_id,)).fetchone()
        if not item:
            return jsonify({"error": "Product not found"}), 404

        new_quantity = max(0, item["quantity"] + delta)
        stock_status = compute_stock_status(new_quantity, item["reorder_point"])

        conn.execute("""
            UPDATE inventory
            SET quantity = ?, stock_status = ?, last_updated = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (new_quantity, stock_status, item_id))

        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "STOCK_ADJUSTED", "inventory", f"Adjusted stock for {item['product_id']}: {item['quantity']} -> {new_quantity} ({'+' if delta > 0 else ''}{delta}). Reason: {reason}", "info", request.remote_addr or "127.0.0.1")
        )

    return jsonify({
        "message": f"Stock adjusted from {item['quantity']} to {new_quantity}",
        "new_quantity": new_quantity,
        "stock_status": stock_status
    }), 200

@inventory_bp.route("/<int:item_id>", methods=["DELETE"])
@token_required
@role_required(["admin", "manager"])
def delete_product(item_id: int):
    with get_db() as conn:
        item = conn.execute("SELECT id, product_id, name FROM inventory WHERE id = ?", (item_id,)).fetchone()
        if not item:
            return jsonify({"error": "Product not found"}), 404

        conn.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
        conn.execute(
            "INSERT INTO activity_logs (user_id, username, action, module, details, severity, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (g.current_user["user_id"], g.current_user["username"], "PRODUCT_DELETED", "inventory", f"Removed product {item['product_id']} ({item['name']})", "warning", request.remote_addr or "127.0.0.1")
        )

    return jsonify({"message": f"Product {item['product_id']} deleted successfully"}), 200

@inventory_bp.route("/export", methods=["GET"])
@token_required
def export_inventory():
    fmt = request.args.get("format", "csv").lower()
    with get_db() as conn:
        items = conn.execute("SELECT * FROM inventory ORDER BY product_id ASC").fetchall()

    if fmt == "json":
        return jsonify({"inventory": items}), 200

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Product ID", "Name", "Category", "Quantity", "Unit Price", "Supplier", "Stock Status", "Reorder Point", "Zone", "SKU"])
    for i in items:
        writer.writerow([i["product_id"], i["name"], i["category"], i["quantity"], i["unit_price"], i["supplier"], i["stock_status"], i["reorder_point"], i["location_zone"], i["sku"]])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=warehousex_inventory_export.csv"}
    )
