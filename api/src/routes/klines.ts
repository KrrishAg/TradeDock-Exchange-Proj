import { Client } from "pg";
import express from "express";

const pgClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "tradedock",
  password: "mypass",
  port: 5433,
});
pgClient.connect();

export const kLinesRouter = express.Router();

kLinesRouter.get("/", async (req, res) => {
  const { symbol, interval, startTime, endTime } = req.query;
  let query;
  switch (interval) {
    case "1m":
      query =
        "SELECT * FROM klines_1m WHERE start_time>=$1 AND start_time<=$2 AND market=$3";
      break;
    case "1h":
      query =
        "SELECT * FROM klines_1h WHERE start_time>=$1 AND start_time<=$2 AND market=$3";
      break;
    case "1w":
      query =
        "SELECT * FROM klines_1w WHERE start_time>=$1 AND start_time<=$2 AND market=$3";
      break;
    default:
      res.status(400).json("Invalid Interval");
  }

  try {
    //@ts-ignore
    const result = await pgClient.query(query, [
      new Date(Number(startTime) * 1000),
      new Date(Number(endTime) * 1000),
      symbol,
    ]);
    console.log("RES FROM KLINES_TABLE -> ", result.rows);

    res.json(
      (result.rows as any[]).map((x: any) => [
        x.start_time,
        x.open,
        x.high,
        x.low,
        x.close,
      ]),
    );
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});
