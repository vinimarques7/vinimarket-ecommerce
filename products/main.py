import os
import json
import sqlite3
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

import httpx
import jwt
import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-jwt-key-change-in-prod")
JWT_ALGORITHM = "HS256"

DB_PATH = os.getenv("DB_PATH", "products.db")
PORT = int(os.getenv("PORT", "5002"))

# Replica configuration: this instance is PRIMARY; writes are forwarded here
# and also to the REPLICA URL when this is the primary.
REPLICA_URL = os.getenv("REPLICA_URL", "")  # e.g. http://localhost:5012
IS_PRIMARY = os.getenv("IS_PRIMARY", "true").lower() == "true"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
security = HTTPBearer(auto_error=False)


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS products (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            name           TEXT    NOT NULL,
            description    TEXT,
            price          REAL    NOT NULL,
            stock          INTEGER NOT NULL DEFAULT 0,
            image_url      TEXT,
            category       TEXT,
            specifications TEXT,
            created_at     TEXT    DEFAULT (datetime('now'))
        )
        """
    )
    # Migration: add new columns to existing databases
    existing = [row[1] for row in conn.execute("PRAGMA table_info(products)").fetchall()]
    for col, definition in [
        ("image_url",      "TEXT"),
        ("category",       "TEXT"),
        ("specifications", "TEXT"),
    ]:
        if col not in existing:
            conn.execute(f"ALTER TABLE products ADD COLUMN {col} {definition}")
    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(a: FastAPI):
    init_db()
    yield


app = FastAPI(title="Products Service", lifespan=lifespan)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ProductCreate(BaseModel):
    name:           str
    description:    Optional[str]            = None
    price:          float
    stock:          int                      = 0
    image_url:      Optional[str]            = None
    category:       Optional[str]            = None
    specifications: Optional[Dict[str, Any]] = None


def _row_to_dict(row) -> dict:
    d = dict(row)
    if d.get("specifications") and isinstance(d["specifications"], str):
        try:
            d["specifications"] = json.loads(d["specifications"])
        except (json.JSONDecodeError, TypeError):
            d["specifications"] = {}
    return d


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def optional_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
    except jwt.InvalidTokenError:
        return None


def require_admin(payload: Optional[dict] = Depends(optional_token)) -> dict:
    if not payload:
        raise HTTPException(status_code=401, detail="Token ausente ou inválido")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return payload


# ---------------------------------------------------------------------------
# Replication helper
# ---------------------------------------------------------------------------


async def replicate_write(method: str, path: str, body: dict) -> None:
    """Forward a write to the replica (fire-and-wait for strong consistency)."""
    if not IS_PRIMARY or not REPLICA_URL:
        return
    url = f"{REPLICA_URL}{path}"
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            if method == "POST":
                await client.post(url, json=body)
            elif method == "PUT":
                await client.put(url, json=body)
            elif method == "DELETE":
                await client.delete(url)
        except httpx.RequestError:
            # Replica unreachable — log but do not block the primary
            print(f"[WARN] Réplica indisponível: {url}")


# ---------------------------------------------------------------------------
# Round-robin read counter (for replica reads)
# ---------------------------------------------------------------------------
_read_counter = 0
SELF_URL = f"http://localhost:{PORT}"


def _next_read_url() -> str:
    """Return either self URL or replica URL in round-robin fashion."""
    global _read_counter
    _read_counter += 1
    if REPLICA_URL and _read_counter % 2 == 0:
        return REPLICA_URL
    return SELF_URL


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok", "service": "products", "is_primary": IS_PRIMARY}


@app.get("/products")
def list_products():
    conn = get_db()
    rows = conn.execute(
        "SELECT id, name, description, price, stock, image_url, category, specifications, created_at "
        "FROM products ORDER BY id"
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


@app.get("/products/{product_id}")
def get_product(product_id: int):
    conn = get_db()
    row = conn.execute(
        "SELECT id, name, description, price, stock, image_url, category, specifications, created_at "
        "FROM products WHERE id = ?",
        (product_id,),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return _row_to_dict(row)


@app.post("/products", status_code=201)
async def create_product(req: ProductCreate, _admin: dict = Depends(require_admin)):
    specs_json = json.dumps(req.specifications, ensure_ascii=False) if req.specifications else None

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO products (name, description, price, stock, image_url, category, specifications) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (req.name, req.description, req.price, req.stock, req.image_url, req.category, specs_json),
    )
    conn.commit()
    product_id = cursor.lastrowid
    conn.close()

    product = {
        "id":             product_id,
        "name":           req.name,
        "description":    req.description,
        "price":          req.price,
        "stock":          req.stock,
        "image_url":      req.image_url,
        "category":       req.category,
        "specifications": req.specifications,
    }

    await replicate_write("POST", "/internal/products", {**product, "specifications": specs_json})
    return product


# ---------------------------------------------------------------------------
# Internal endpoint used by replica propagation (no auth required)
# ---------------------------------------------------------------------------


@app.put("/products/{product_id}", status_code=200)
async def update_product(product_id: int, req: ProductCreate, _admin: dict = Depends(require_admin)):
    conn = get_db()
    row = conn.execute("SELECT id FROM products WHERE id = ?", (product_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    specs_json = json.dumps(req.specifications, ensure_ascii=False) if req.specifications else None
    conn.execute(
        "UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, category=?, specifications=? WHERE id=?",
        (req.name, req.description, req.price, req.stock, req.image_url, req.category, specs_json, product_id),
    )
    conn.commit()
    conn.close()
    product = {"id": product_id, "name": req.name, "description": req.description,
               "price": req.price, "stock": req.stock, "image_url": req.image_url,
               "category": req.category, "specifications": req.specifications}
    await replicate_write("PUT", f"/internal/products/{product_id}", {**product, "specifications": specs_json})
    return product


@app.put("/internal/products/{product_id}", status_code=200, include_in_schema=False)
def internal_update_product(product_id: int, req: dict):
    conn = get_db()
    conn.execute(
        "UPDATE products SET name=?, description=?, price=?, stock=?, image_url=?, category=?, specifications=? WHERE id=?",
        (req["name"], req.get("description"), req["price"], req["stock"],
         req.get("image_url"), req.get("category"), req.get("specifications"), product_id),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/internal/products", status_code=201, include_in_schema=False)
def internal_create_product(req: dict):
    """Receives replicated writes from the primary. No JWT required."""
    conn = get_db()
    conn.execute(
        "INSERT OR REPLACE INTO products "
        "(id, name, description, price, stock, image_url, category, specifications) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            req.get("id"), req["name"], req.get("description"),
            req["price"], req["stock"],
            req.get("image_url"), req.get("category"), req.get("specifications"),
        ),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
