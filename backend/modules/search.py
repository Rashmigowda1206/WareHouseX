"""
WareHouseX Search API Blueprint.
Endpoints:
- GET  /api/search/exact   : Exact string match on item_id, SKU, or barcode (no vector search).
- POST /api/search/semantic: Dense semantic vector search via Qdrant with metadata filtering.
- GET  /api/search/similar : Finds semantically related products for an item_id.
- GET  /api/search/filters : Available categories, locations, suppliers, and stock statuses.
"""
from flask import Blueprint, request, jsonify, g
from modules.auth import token_required
from services.search_service import search_service

search_bp = Blueprint("search", __name__)

@search_bp.route("/exact", methods=["GET"])
@token_required
def exact_search_route():
    """
    Exact search for item_id, SKU, or barcode.
    Never uses vector similarity for exact identification.
    """
    query = request.args.get("query", "").strip()
    search_type = request.args.get("type", "all").strip().lower()

    if not query:
        return jsonify({"error": "Search query parameter 'query' is required", "items": [], "count": 0}), 400

    items = search_service.exact_search(query=query, search_type=search_type)
    return jsonify({
        "query": query,
        "search_type": search_type,
        "items": items,
        "count": len(items)
    }), 200

@search_bp.route("/semantic", methods=["POST", "GET"])
@token_required
def semantic_search_route():
    """
    Semantic vector search:
    Accepts natural-language queries (e.g. 'Show me wireless devices with low stock')
    and applies Qdrant vector similarity + structured metadata filtering.
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        query = data.get("query", "").strip()
        category = data.get("category")
        warehouse_location = data.get("warehouse_location") or data.get("location_zone")
        status = data.get("status")
        limit = int(data.get("limit", 20))
        offset = int(data.get("offset", 0))
    else:
        query = request.args.get("query", "").strip()
        category = request.args.get("category")
        warehouse_location = request.args.get("warehouse_location") or request.args.get("location_zone")
        status = request.args.get("status")
        limit = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))

    if not query:
        return jsonify({"error": "Search query is required", "results": [], "count": 0}), 400

    res = search_service.semantic_search(
        query=query,
        category=category,
        warehouse_location=warehouse_location,
        status=status,
        limit=limit,
        offset=offset
    )

    return jsonify(res), 200

@search_bp.route("/similar/<item_id>", methods=["GET"])
@token_required
def similar_items_route(item_id: str):
    """
    Retrieves the top semantically similar products for a given item_id.
    """
    limit = int(request.args.get("limit", 6))
    similar = search_service.find_similar(item_id=item_id, limit=limit)
    return jsonify({
        "item_id": item_id,
        "similar_items": similar,
        "count": len(similar)
    }), 200

@search_bp.route("/filters", methods=["GET"])
@token_required
def get_search_filters():
    """
    Returns available filter values (categories, locations, suppliers, statuses)
    directly from the Qdrant vector database.
    """
    filters = search_service.get_filters()
    return jsonify(filters), 200
