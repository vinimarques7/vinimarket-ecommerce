# README — Execução do Mini E-commerce Distribuído

## Estrutura do Projeto

```
entrega/
├── gateway/            API Gateway (porta 8000)
├── users/              Serviço de Usuários (porta 5001)
├── products/           Serviço de Produtos — primário (porta 5002) e réplica (porta 5012)
├── orders/             Serviço de Pedidos (porta 5003)
├── docker-compose.yml
└── README_execucao.md
```

---

## Opção 1 — Docker Compose (recomendado)

### Pré-requisitos
- Docker >= 24
- Docker Compose >= 2.20

### Subir tudo

```bash
cd entrega
docker compose up --build
```

Todos os serviços sobem automaticamente. O gateway estará disponível em `http://localhost:8000`.

### Parar

```bash
docker compose down
```

---

## Opção 2 — Execução local (sem Docker)

### Pré-requisitos
- Python >= 3.11
- pip

### Instalar dependências de cada serviço

```bash
cd entrega/users    && pip install -r requirements.txt
cd ../products      && pip install -r requirements.txt
cd ../orders        && pip install -r requirements.txt
cd ../gateway       && pip install -r requirements.txt
```

### Iniciar os serviços (cada um em um terminal separado)

```bash
# Terminal 1 — Usuários
cd entrega/users
PORT=5001 python main.py

# Terminal 2 — Produtos (primário)
cd entrega/products
PORT=5002 IS_PRIMARY=true REPLICA_URL=http://localhost:5012 DB_PATH=products_primary.db python main.py

# Terminal 3 — Produtos (réplica)
cd entrega/products
PORT=5012 IS_PRIMARY=false DB_PATH=products_replica.db python main.py

# Terminal 4 — Pedidos
cd entrega/orders
PORT=5003 python main.py

# Terminal 5 — Gateway
cd entrega/gateway
PORT=8000 USERS_URL=http://localhost:5001 PRODUCTS_URL=http://localhost:5002 ORDERS_URL=http://localhost:5003 python main.py
```

> **Variável JWT_SECRET:** por padrão usa `super-secret-jwt-key-change-in-prod`. Para customizar, exporte a variável antes de iniciar **todos** os serviços:
> ```bash
> export JWT_SECRET=minha-chave-secreta
> ```

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
| POST | `/products` | JWT (admin) | Cria produto |

### Pedidos
| Método | URL | Auth | Descrição |
|--------|-----|------|-----------|
| POST | `/orders` | JWT | Cria pedido |
| GET | `/orders/{userId}` | JWT | Lista pedidos do usuário |

### Gateway
| Método | URL | Descrição |
|--------|-----|-----------|
| GET | `/health` | Status do gateway e serviços |
| GET | `/dashboard` | Dashboard HTML de monitoramento |

---

## Exemplo de fluxo com curl

```bash
BASE=http://localhost:8000

# 1. Registrar admin
curl -s -X POST $BASE/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@loja.com","password":"senha123","role":"admin"}' | jq

# 2. Login e capturar token
TOKEN=$(curl -s -X POST $BASE/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loja.com","password":"senha123"}' | jq -r '.token')

echo "Token: $TOKEN"

# 3. Criar produto (requer role=admin)
curl -s -X POST $BASE/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Notebook","description":"16GB RAM","price":4500.00,"stock":10}' | jq

# 4. Registrar usuário comum e fazer login
curl -s -X POST $BASE/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@loja.com","password":"senha456"}' | jq

USER_TOKEN=$(curl -s -X POST $BASE/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@loja.com","password":"senha456"}' | jq -r '.token')

# 5. Criar pedido
curl -s -X POST $BASE/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"product_id":1,"quantity":2}' | jq

# 6. Listar pedidos (USER_ID da resposta do register)
curl -s $BASE/orders/2 \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

---

## Dashboard de Monitoramento

Acesse `http://localhost:8000/dashboard` no navegador para visualizar:
- Status de cada microsserviço (ONLINE / OFFLINE)
- Número de falhas consecutivas
- Log de eventos de heartbeat em tempo real

A página atualiza automaticamente a cada 5 segundos.

---

## Simular falha de serviço

Com Docker:
```bash
docker compose stop orders
# Aguarde ~10s e observe o dashboard — orders ficará OFFLINE
docker compose start orders
# Aguarde ~5s — orders volta a ONLINE e o gateway registra a recuperação
```

Localmente: basta encerrar o processo do serviço desejado (Ctrl+C no terminal).
