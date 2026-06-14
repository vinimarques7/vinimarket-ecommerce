# Mini E-commerce Distribuído — Instruções de Execução

## Estrutura do Projeto

```
entrega/
├── gateway/              API Gateway (porta 8000)
├── users/                Serviço de Usuários (porta 5001)
├── products/             Serviço de Produtos — primário (5002) e réplica (5012)
├── orders/               Serviço de Pedidos (porta 5003)
├── frontend/             Interface web (React + Vite)
├── seed_products.py      Script para popular o banco com produtos de exemplo
├── docker-compose.yml
├── relatorio.pdf
└── README_execucao.md
```

---

## Execução com Docker (recomendado)

### Pré-requisitos
- Docker >= 24
- Docker Compose >= 2.20

### 1. Subir todos os serviços

```bash
cd entrega
docker compose up -d --build
```

Aguarde ~10 segundos para todos os serviços iniciarem.

### 2. Popular o banco com produtos de exemplo (opcional)

```bash
python3 seed_products.py
```

Cria 44 produtos de tecnologia com imagens e categorias variadas.
Também registra o usuário admin caso não exista.

### 3. Parar

```bash
docker compose down
```

---

## URLs após inicialização

| Serviço | URL |
|---------|-----|
| Interface Web | http://localhost:3000 |
| API Gateway | http://localhost:8000 |
| Dashboard de Monitoramento | http://localhost:8000/dashboard |
| Status dos Serviços (JSON) | http://localhost:8000/status |

---

## Credenciais de Teste

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@vinimarket.com | admin@2024 |
| Usuário comum | Cadastrar via `/users/register` ou pela interface |

---

## Teste Rápido via curl

```bash
BASE=http://localhost:8000

# 1. Login como admin e capturar token
TOKEN=$(curl -s -X POST $BASE/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vinimarket.com","password":"admin@2024"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Listar produtos
curl -s $BASE/products | python3 -m json.tool | head -30

# 3. Criar produto (requer JWT de admin)
curl -s -X POST $BASE/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Notebook Gamer","description":"RTX 4060","price":4999.99,"stock":5}' \
  | python3 -m json.tool

# 4. Registrar usuário comum
curl -s -X POST $BASE/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Joao","email":"joao@teste.com","password":"senha123"}' \
  | python3 -m json.tool

# 5. Login como usuário comum
USER_TOKEN=$(curl -s -X POST $BASE/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","password":"senha123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
USER_ID=$(curl -s -X POST $BASE/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","password":"senha123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])")

# 6. Criar pedido
curl -s -X POST $BASE/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"product_id":1,"quantity":1,"total_price":4999.99}' \
  | python3 -m json.tool

# 7. Listar pedidos do usuário
curl -s $BASE/orders/$USER_ID \
  -H "Authorization: Bearer $USER_TOKEN" \
  | python3 -m json.tool

# 8. Tentar criar produto como usuário comum (deve retornar 403)
curl -s -X POST $BASE/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"Produto Proibido","price":1.00,"stock":1}' \
  | python3 -m json.tool
```

---

## Endpoints disponíveis (via Gateway em :8000)

### Usuários
| Método | URL | Auth | Descrição |
|--------|-----|------|-----------|
| POST | `/users/register` | — | Registra usuário |
| POST | `/users/login` | — | Autentica, retorna JWT |
| GET | `/users/{id}` | JWT | Dados do usuário |

### Produtos
| Método | URL | Auth | Descrição |
|--------|-----|------|-----------|
| GET | `/products` | — | Lista produtos |
| GET | `/products/{id}` | — | Detalhe do produto |
| POST | `/products` | JWT admin | Cria produto |
| PUT | `/products/{id}` | JWT admin | Edita produto |

### Pedidos
| Método | URL | Auth | Descrição |
|--------|-----|------|-----------|
| POST | `/orders` | JWT | Cria pedido |
| GET | `/orders/{userId}` | JWT | Lista pedidos do usuário |
| DELETE | `/orders/{id}` | JWT | Exclui pedido (dono ou admin) |

### Gateway
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/health` | Health check do gateway |
| GET | `/status` | Status JSON de todos os serviços |
| GET | `/dashboard` | Dashboard HTML de monitoramento |

---

## Simular Falha de Serviço (teste de heartbeat)

```bash
# Derrubar o serviço de pedidos
docker compose stop orders

# Aguarde ~10s e observe: http://localhost:8000/dashboard
# orders ficará OFFLINE e requisições retornarão 503

# Restaurar
docker compose start orders
# Aguarde ~5s — orders volta a ONLINE, gateway registra recuperação em log
```

---

## Execução Local (sem Docker)

### Pré-requisitos
- Python >= 3.11
- pip

```bash
# Instalar dependências
cd entrega/users    && pip install -r requirements.txt
cd ../products      && pip install -r requirements.txt
cd ../orders        && pip install -r requirements.txt
cd ../gateway       && pip install -r requirements.txt

# Terminal 1 — Usuários
cd entrega/users && PORT=5001 python main.py

# Terminal 2 — Produtos primário
cd entrega/products && PORT=5002 IS_PRIMARY=true REPLICA_URL=http://localhost:5012 DB_PATH=products_primary.db python main.py

# Terminal 3 — Produtos réplica
cd entrega/products && PORT=5012 IS_PRIMARY=false DB_PATH=products_replica.db python main.py

# Terminal 4 — Pedidos
cd entrega/orders && PORT=5003 python main.py

# Terminal 5 — Gateway
cd entrega/gateway && PORT=8000 USERS_URL=http://localhost:5001 PRODUCTS_URL=http://localhost:5002 ORDERS_URL=http://localhost:5003 python main.py
```
