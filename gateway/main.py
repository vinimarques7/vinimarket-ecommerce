import asyncio
import logging
import os
import time
from datetime import datetime, timezone

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from starlette.background import BackgroundTask

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-jwt-key-change-in-prod")

USERS_URL    = os.getenv("USERS_URL",    "http://localhost:5001")
PRODUCTS_URL = os.getenv("PRODUCTS_URL", "http://localhost:5002")
ORDERS_URL   = os.getenv("ORDERS_URL",   "http://localhost:5003")

HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "5"))   # seconds
HEARTBEAT_MAX_FAIL = int(os.getenv("HEARTBEAT_MAX_FAIL", "2"))    # failures before marking down

PORT = int(os.getenv("PORT", "8000"))

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
log = logging.getLogger("gateway")

# ---------------------------------------------------------------------------
# Service registry
# ---------------------------------------------------------------------------
SERVICES: dict[str, dict] = {
    "users":    {"url": USERS_URL,    "healthy": True, "failures": 0, "last_check": None},
    "products": {"url": PRODUCTS_URL, "healthy": True, "failures": 0, "last_check": None},
    "orders":   {"url": ORDERS_URL,   "healthy": True, "failures": 0, "last_check": None},
}

# Heartbeat log (last 100 entries shown on dashboard)
heartbeat_log: list[dict] = []

MAX_LOG_ENTRIES = 100

# ---------------------------------------------------------------------------
# Heartbeat task
# ---------------------------------------------------------------------------


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


async def heartbeat_loop() -> None:
    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL)
        async with httpx.AsyncClient(timeout=3.0) as client:
            for name, svc in SERVICES.items():
                url = f"{svc['url']}/health"
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                    svc["last_check"] = _ts()
                    if not svc["healthy"]:
                        msg = f"Serviço '{name}' RECUPERADO"
                        log.info(msg)
                        heartbeat_log.append({"ts": _ts(), "level": "RECOVERY", "msg": msg})
                    svc["healthy"] = True
                    svc["failures"] = 0
                except Exception:
                    svc["failures"] += 1
                    svc["last_check"] = _ts()
                    msg = f"Serviço '{name}' falhou heartbeat (tentativa {svc['failures']})"
                    log.warning(msg)
                    heartbeat_log.append({"ts": _ts(), "level": "WARN", "msg": msg})
                    if svc["failures"] >= HEARTBEAT_MAX_FAIL:
                        if svc["healthy"]:
                            fail_msg = f"Serviço '{name}' marcado como INDISPONÍVEL após {svc['failures']} falhas"
                            log.error(fail_msg)
                            heartbeat_log.append({"ts": _ts(), "level": "DOWN", "msg": fail_msg})
                        svc["healthy"] = False

        # Keep log bounded
        if len(heartbeat_log) > MAX_LOG_ENTRIES:
            heartbeat_log[:] = heartbeat_log[-MAX_LOG_ENTRIES:]


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
app = FastAPI(title="API Gateway")


@app.on_event("startup")
async def startup():
    asyncio.create_task(heartbeat_loop())
    log.info("Gateway iniciado. Heartbeat a cada %ds", HEARTBEAT_INTERVAL)


# ---------------------------------------------------------------------------
# Proxy helper
# ---------------------------------------------------------------------------


def _require_healthy(service_name: str) -> str:
    svc = SERVICES[service_name]
    if not svc["healthy"]:
        raise HTTPException(
            status_code=503,
            detail=f"Serviço '{service_name}' indisponível no momento",
        )
    return svc["url"]


async def _proxy(request: Request, target_url: str) -> Response:
    """Forward the request to target_url and return the response."""
    # Build the outgoing headers (forward Authorization if present)
    headers = {}
    if "authorization" in request.headers:
        headers["authorization"] = request.headers["authorization"]
    if "content-type" in request.headers:
        headers["content-type"] = request.headers["content-type"]

    body = await request.body()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                params=dict(request.query_params),
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Erro ao contactar serviço: {exc}")

    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers),
        media_type=resp.headers.get("content-type"),
    )


# ---------------------------------------------------------------------------
# Routes — Users
# ---------------------------------------------------------------------------


@app.api_route("/users/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_users(path: str, request: Request):
    base = _require_healthy("users")
    return await _proxy(request, f"{base}/users/{path}")


# ---------------------------------------------------------------------------
# Routes — Products
# ---------------------------------------------------------------------------


@app.api_route("/products/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_products_with_path(path: str, request: Request):
    base = _require_healthy("products")
    return await _proxy(request, f"{base}/products/{path}")


@app.api_route("/products", methods=["GET", "POST"])
async def proxy_products(request: Request):
    base = _require_healthy("products")
    return await _proxy(request, f"{base}/products")


# ---------------------------------------------------------------------------
# Routes — Orders
# ---------------------------------------------------------------------------


@app.api_route("/orders/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_orders_with_path(path: str, request: Request):
    base = _require_healthy("orders")
    return await _proxy(request, f"{base}/orders/{path}")


@app.api_route("/orders", methods=["GET", "POST"])
async def proxy_orders(request: Request):
    base = _require_healthy("orders")
    return await _proxy(request, f"{base}/orders")


# ---------------------------------------------------------------------------
# Health (gateway itself)
# ---------------------------------------------------------------------------


@app.get("/health")
def gateway_health():
    return {
        "status": "ok",
        "service": "gateway",
        "services": {
            name: {"healthy": svc["healthy"], "last_check": svc["last_check"]}
            for name, svc in SERVICES.items()
        },
    }


# ---------------------------------------------------------------------------
# Dashboard HTML
# ---------------------------------------------------------------------------

DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="5" />
  <title>Vini Market — Gateway Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { color: #38bdf8; margin-bottom: 1.5rem; font-size: 1.6rem; }
    h2 { color: #94a3b8; font-size: 1rem; margin-bottom: 0.75rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #1e293b; border-radius: 10px; padding: 1.2rem; border: 2px solid #334155; }
    .card.up   { border-color: #22c55e; }
    .card.down { border-color: #ef4444; }
    .card h3 { font-size: 1.1rem; margin-bottom: 0.4rem; }
    .badge { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .badge.up   { background: #14532d; color: #4ade80; }
    .badge.down { background: #450a0a; color: #f87171; }
    .meta { font-size: 0.75rem; color: #64748b; margin-top: 0.4rem; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 10px; overflow: hidden; }
    th { background: #0f172a; padding: 0.7rem 1rem; text-align: left; font-size: 0.8rem; color: #94a3b8; }
    td { padding: 0.6rem 1rem; font-size: 0.8rem; border-top: 1px solid #334155; }
    .level-DOWN     { color: #f87171; font-weight: 700; }
    .level-WARN     { color: #facc15; }
    .level-RECOVERY { color: #4ade80; }
    .level-INFO     { color: #94a3b8; }
  </style>
</head>
<body>
  <h1>&#128293; Vini Market — Gateway Dashboard</h1>
  <div class="grid">
    {cards}
  </div>
  <h2>&#128221; Log de Heartbeat (últimas {log_count} entradas)</h2>
  <table>
    <thead><tr><th>Timestamp</th><th>Nível</th><th>Mensagem</th></tr></thead>
    <tbody>
      {rows}
    </tbody>
  </table>
  <p style="margin-top:1rem;font-size:0.7rem;color:#334155;">Atualizado automaticamente a cada 5s</p>
</body>
</html>
"""


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard():
    cards_html = ""
    for name, svc in SERVICES.items():
        status = "up" if svc["healthy"] else "down"
        badge_label = "ONLINE" if svc["healthy"] else "OFFLINE"
        last = svc["last_check"] or "—"
        cards_html += f"""
        <div class="card {status}">
          <h3>{name.capitalize()}</h3>
          <span class="badge {status}">{badge_label}</span>
          <p class="meta">Falhas consecutivas: {svc['failures']}</p>
          <p class="meta">Último check: {last}</p>
          <p class="meta">URL: {svc['url']}</p>
        </div>
        """

    rows_html = ""
    for entry in reversed(heartbeat_log[-50:]):
        level_cls = f"level-{entry['level']}"
        rows_html += f"<tr><td>{entry['ts']}</td><td class='{level_cls}'>{entry['level']}</td><td>{entry['msg']}</td></tr>"

    if not rows_html:
        rows_html = "<tr><td colspan='3' style='color:#64748b;text-align:center'>Nenhum evento registrado ainda...</td></tr>"

    html = DASHBOARD_HTML.replace("{cards}", cards_html)
    html = html.replace("{rows}", rows_html)
    html = html.replace("{log_count}", str(len(heartbeat_log)))
    return HTMLResponse(content=html)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
