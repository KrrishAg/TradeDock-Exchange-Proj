import { Router } from "express";
import { Client } from "pg";

const pgClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mypass",
  port: 5433,
});
pgClient.connect();

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
  const { symbol } = req.query;
  console.log(" GET /trades ->", symbol);
  // getting from DB
  const query = "SELECT * FROM trades_db WHERE market=$1 ORDER BY time";
  try {
    const response = await pgClient.query(query, [symbol]);
    console.log(` /trades ${symbol}: ${response.rows.length} rows`);
    res.json(response.rows);
  } catch (error) {
    console.error(" /trades query failed for", symbol, error);
    res.status(500).json([]);
  }
});
