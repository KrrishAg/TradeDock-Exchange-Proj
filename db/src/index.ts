import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./types";

const pgClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "tradedock",
  password: "mypass",
  port: 5433,
});
pgClient.connect();

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("CONNECTED to REDIS");

  while (true) {
    const response = await redisClient.brPop("db_process", 0);
    if (response) {
      const message: DbMessage = JSON.parse(response.element);
      console.log("MESSAGE: ", message);
      if (message.type === "TRADE_ADDED") {
        console.log("Ddding data");
        const price = message.data.price;
        const volume = message.data.quantity;
        const market = message.data.market;
        const timestamp = new Date(message.data.timestamp);
        const query =
          "INSERT INTO trades_db (time, price, volume, market) VALUES ($1, $2, $3, $4)";
        // TODO: How to add volume?
        const values = [timestamp, price, volume, market];
        await pgClient.query(query, values);
      }
    }
  }
}

main();
