import os
import sqlite3

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

DB_PATH = os.getenv("DB_PATH", "orders.db")
PORT = int(os.getenv("PORT", "5003"))

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
app = FastAPI(title="Orders Service")
security = HTTPBearer()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS orders (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity   INTEGER NOT NULL DEFAULT 1,
            status     TEXT    NOT NULL DEFAULT 'pending',
            created_at TEXT    DEFAULT (datetime('now'))
        )
        """
    )
    conn.commit()
    conn.close()


init_db()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class OrderCreate(BaseModel):
    product_id: int
    quantity: int = 1


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def decode_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    try:
        return jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok", "service": "orders"}


@app.post("/orders", status_code=201)
def create_order(req: OrderCreate, payload: dict = Depends(decode_token)):
    user_id = payload["userId"]

    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO orders (user_id, product_id, quantity) VALUES (?, ?, ?)",
        (user_id, req.product_id, req.quantity),
    )
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()

    return {
        "id": order_id,
        "userId": user_id,
        "productId": req.product_id,
        "quantity": req.quantity,
        "status": "pending",
    }


@app.get("/orders/{user_id}")
def get_user_orders(user_id: int, payload: dict = Depends(decode_token)):
    # Users can only see their own orders; admins can see any
    if payload.get("role") != "admin" and payload["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")

    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()

    return [dict(r) for r in rows]


@app.delete("/orders/{order_id}", status_code=204)
def delete_order(order_id: int, payload: dict = Depends(decode_token)):
    conn = get_db()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if payload.get("role") != "admin" and payload["userId"] != row["user_id"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Acesso negado")
    conn.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()
    return None


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
