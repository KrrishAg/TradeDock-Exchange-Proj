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

export const tickerRouter = Router();

tickerRouter.get("/", async (req, res) => {
  try {
    const { symbol } = req.query;
    console.log("Getting ticker for symbol -> ", symbol);
    //getting from db
    const query = "SELECT * FROM trades_db WHERE TRIM(market)=$1";
    const response = await pgClient.query(query, [symbol]);
    const lastRow = response.rows[response.rows.length - 1];
    // console.log(lastRow);
    res.json({ lastPrice: lastRow.price });
  } catch (error) {
    console.log("ERROR in getting goddamn ticker -> ", error);
    res.json({ lastPrice: "No Trade" });
  }
});
