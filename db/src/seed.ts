import { Client } from "pg";

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mypass",
  port: 5433,
});

async function initializeDB() {
  await client.connect();
  console.log("Connected to Postgres, creating tables and views...");

  await client.query(`
        DROP TABLE IF EXISTS trades_db;
        CREATE TABLE trades_db(
            time    TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            volume  DOUBLE PRECISION,
            market  VARCHAR (20)
        );
        
        SELECT create_hypertable('trades_db', 'time', 'price', 2);
    `);

  await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS start_time,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            market
        FROM trades_db
        GROUP BY start_time, market;
    `);

  await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS start_time,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            market
        FROM trades_db
        GROUP BY start_time, market;
    `);

  await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS start_time,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            market
        FROM trades_db
        GROUP BY start_time, market;
    `);

  await client.end();
  console.log("Database initialized successfully");
}

initializeDB().catch((e) => console.error("db Initialization failed ->", e));
