import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./types";

const pgClient = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mypass",
  port: 5433,
});
pgClient
  .connect()
  .then(() => console.log(" Connected to Postgres"))
  .catch((e) => console.error(" Postgres connection failed ->", e));

async function main() {
  const redisClient = createClient();
  redisClient.on("error", (e) => console.error(" Redis error ->", e));
  await redisClient.connect();
  console.log(
    " Connected to Redis, waiting for messages on 'db_process' queue",
  );

  while (true) {
    const response = await redisClient.brPop("db_process", 0);
    if (response) {
      const message: DbMessage = JSON.parse(response.element);
      console.log(" Received:", message.type);
      if (message.type === "TRADE_ADDED") {
        const price = message.data.price;
        const volume = message.data.quantity;
        const market = message.data.market;
        const timestamp = new Date(message.data.timestamp);
        const query =
          "INSERT INTO trades_db (time, price, volume, market) VALUES ($1, $2, $3, $4)";
        // TODO: How to add volume?
        const values = [timestamp, price, volume, market];
        try {
          await pgClient.query(query, values);
          console.log(
            ` Trade inserted: ${market} at price ${price} and qty ${volume}`,
          );
        } catch (error) {
          console.error(" Failed to insert trade ->", error);
        }
      }
    }
  }
}

main();
