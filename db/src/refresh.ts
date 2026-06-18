import { Client } from "pg";

const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mypass",
  port: 5433,
});
client.connect();

async function refreshViews() {
  await client.query("REFRESH MATERIALIZED VIEW klines_1m");
  await client.query("REFRESH MATERIALIZED VIEW klines_1h");
  await client.query("REFRESH MATERIALIZED VIEW klines_1w");
}

refreshViews().catch((e) => console.error("[DB:refresh] Refresh failed ->", e));

setInterval(() => {
  refreshViews().catch((e) =>
    console.error("[DB:refresh] Refresh failed ->", e),
  );
}, 1000 * 10);
