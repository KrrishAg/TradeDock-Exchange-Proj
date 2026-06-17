# 📈 TradeDock

Tradedock is a high-performance, full-stack trading ecosystem. It features a custom-built matching engine, an automated market maker for liquidity, and a real-time data pipeline for live charts and order books.

---

## 🏗 System Architecture

Tradedock operates on a distributed, event-driven architecture designed for low latency.

- **Engine:** The core matching logic. It maintains the order book in memory and persists state via snapshots.
- **Redis:** Acts as the high-speed message broker between the Engine, API, and WebSockets.
- **Websocket Server:** Manages persistent connections to clients for real-time price and trade broadcasts.
- **API & DB:** Handles user authentication, asset balances, and historical data storage (PostgreSQL).


### Services & Ports

| Service | Folder | Port | Talks to |
| :------ | :----- | :--- | :------- |
| API | `api/` | **3000** | Redis, Postgres |
| WebSocket server | `WebSoc/` | **3001** | Redis (pub/sub) |
| Frontend | `client/` | **3002** | API (`3000`), WebSocket (`3001`) |
| Engine | `engine/` | — (Redis only) | Redis |
| DB worker | `db/` | — (→ Postgres `5432`) | Redis, Postgres |
| Market Maker | `MarketMaker/` | — (→ API) | API |
| Redis | docker | **6379** | — |
| TimescaleDB | docker | **5432** | — |

> ⚠️ The API and a default `next dev` both want port `3000`, so the frontend is run on `3002`
> (see step 4). The client expects the API on `3000` and the WebSocket server on `3001`.

---

## 🚀 Core Features

- **Matching Engine:** Handles high-throughput order execution with built-in snapshot persistence (`snapshot.json`).
- **Liquidity Bot (Market Maker):** Configurable scripts to fill order books and simulate realistic market activity.
- **Real-time Pipeline:** WebSocket server for sub-millisecond price and trade updates.
- **Data API:** Next.js powered REST API for user actions and historical chart data.
- **Infrastructure:** Redis-based state management and automated database view refreshing for analytics.

---

## 🛠 Tech Stack

| Component          | Technology                       |
| :----------------- | :------------------------------- |
| **Frontend**       | Next.js / React                  |
| **Backend API**    | Node.js / Express                |
| **Engine**         | Node.js (High-performance Logic) |
| **Database**       | PostgreSQL                       |
| **Message Broker** | Redis                            |
| **DevOps**         | Docker & Docker Compose          |

---

## 🚦 Getting Started

### 1. Infrastructure Setup

Start the core infrastructure (Redis + TimescaleDB). The compose file lives in `docker/`:

```bash
cd docker && docker-compose up -d && cd ..
```

### 2. Install Dependencies

There is **no root `package.json`** — each service is independent, so install per service:

```bash
cd engine && npm install && cd ..
cd api && npm install && cd ..
cd WebSoc && npm install && cd ..
cd client && npm install && cd ..
cd MarketMaker && npm install && cd ..
cd db && npm install && cd ..
```

### 3. Database Initialization

The DB scripts live in the `db/` service. Run them from there:

```bash
cd db

# Create the trades hypertable + kline (candle) materialized views
npm run seed:db

# In a separate terminal: refresh the chart views on an interval (leave running)
npm run refresh:views

cd ..
```

> Note: `seed:db` only sets up the database **schema** (the `trades_db` hypertable and the
> `klines_1m` / `klines_1h` / `klines_1w` views). Test users and starting balances are seeded
> in-memory by the **engine** on first boot — see `engine/src/logic/market_logic.ts`.

### 4. Running the Services

Open a separate terminal per component to keep the logs readable:

```bash
# Order Engine (consumes the Redis "messages" queue)
cd engine && npm run dev

# API service  → http://localhost:3000
cd api && npm run dev

# WebSocket server  → ws://localhost:3001
cd WebSoc && npm run dev

# DB worker (consumes the Redis "db_process" queue)
cd db && npm run dev

# Frontend  → http://localhost:3002  (port 3000 is taken by the API)
cd client && npm run dev -- -p 3002
```

## 🤖 Market Maker

To simulate trades and fill the order book for testing, you can start the Market Maker script:

```bash
cd MarketMaker && npm run dev
```

## 🧪 Testing Credentials

For quick local testing, you can use the following accounts:

- **User 1:** ID: 1 | Pass: 111
- **User 2:** ID: 2 | Pass: 222

## 🧹 Maintenance & Troubleshooting

### Resetting the Engine

The engine stores state in a local snapshot. For a clean slate:

- Stop the engine
- Delete snapshot.json
- Restart the engine

### Hard Reset

If you want to clear all trades and chart history:

```bash
# Stop containers and remove volumes (compose file is in docker/)
cd docker && docker-compose down -v && cd ..
```

_(Warning: This will stop all services as they rely on Redis being active.)_
