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

export const tickerRouter = Router();

tickerRouter.get("/", async (req, res) => {
  try {
    const { symbol } = req.query;
    console.log(" GET /ticker ->", symbol);
    //getting from db
    const query =
      "SELECT * FROM trades_db WHERE TRIM(market)=$1 ORDER BY time DESC LIMIT 1";
    const response = await pgClient.query(query, [symbol]);

    if (response.rows.length === 0) {
      return res.json({ lastPrice: "No Trade" });
    }

    return res.json({
      lastPrice: response.rows[0].price,
    });
  } catch (error) {
    console.error(" /ticker query failed for", req.query.symbol, error);
    res.json({ lastPrice: "No Trade" });
  }
});
