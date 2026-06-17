import { Router } from "express";
import { Client } from "pg";

const pgClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "tradedock",
  password: "mypass",
  port: 5433,
});
pgClient.connect();

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
  const { symbol } = req.query;
  console.log("Getting trades for symbol -> ", symbol);
  // getting from DB
  const query = "SELECT * FROM trades_db WHERE market=$1";
  const response = await pgClient.query(query, [symbol]);
  res.json(response.rows);
});
