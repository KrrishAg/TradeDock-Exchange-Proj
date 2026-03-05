# 📈 TradeDock

Tradedock is a high-performance, full-stack trading ecosystem. It features a custom-built matching engine, an automated market maker for liquidity, and a real-time data pipeline for live charts and order books.

---

## 🏗 System Architecture

Tradedock operates on a distributed, event-driven architecture designed for low latency.

- **Engine:** The core matching logic. It maintains the order book in memory and persists state via snapshots.
- **Redis:** Acts as the high-speed message broker between the Engine, API, and WebSockets.
- **Websocket Server:** Manages persistent connections to clients for real-time price and trade broadcasts.
- **API & DB:** Handles user authentication, asset balances, and historical data storage (PostgreSQL).

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

Start the core services (Redis, Database):

```bash
docker-compose up -d
```

### 2. Install Dependencies

You must install the packages for each service before running them:

```bash
# Install root and individual service dependencies
npm install
cd engine && npm install && cd ..
cd api && npm install && cd ..
cd WebSoc && npm install && cd ..
cd client && npm install && cd ..
cd MarketMaker && npm install && cd ..
cd db && npm install && cd ..
```

### 3. Database Initialization

Seed the initial data and set up the analytics views:

```bash
# Seed users and assets
npm run seed:db

# Start the cron job to refresh materialized views for charts
npm run refresh:views
```

### 4. Running the Services

Open separate terminals for each component to keep track of logs:

```bash
# Start the Order Engine
cd engine && npm run dev

# Start the API Service
cd api && npm run dev

# Start the WebSocket Server
cd WebSoc && npm run dev

# Start the Frontend
cd client && npm run dev
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
# Stop containers and remove volumes
docker-compose down -v
```

_(Warning: This will stop all services as they rely on Redis being active.)_
