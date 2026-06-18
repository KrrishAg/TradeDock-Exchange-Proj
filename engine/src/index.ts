import { createClient } from "redis";
import { Engine } from "./logic/Engine";

async function main() {
  console.log("ENGINE starting");
  const redisClient = createClient();
  redisClient.on("error", (e) => console.error("  Redis error ->", e));
  await redisClient.connect();
  console.log("  Connected to Redis, waiting for orders on 'messages' queue");
  const engine = new Engine();

  while (true) {
    const response = await redisClient.brPop("messages", 0);
    if (response) {
      engine.process(JSON.parse(response.element));
    }
  }
}

main();
