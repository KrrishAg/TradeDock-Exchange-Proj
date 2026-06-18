import axios from "axios";
import { performance } from "perf_hooks";

const BASE_URL = "http://localhost:3000";
const MARKET = "WIPRO_INR";
const USER_ID = "5"; //using the 5th user id

const TEST_DURATION = 10000; // 10 seconds

let totalOrders = 0;
let latencies: number[] = [];

async function placeOrder(side: "buy" | "sell", price: number) {
  const start = performance.now();

  try {
    await axios.post(`${BASE_URL}/api/v1/order`, {
      market: MARKET,
      price: price.toFixed(1),
      quantity: "1",
      side,
      userId: USER_ID,
    });

    const end = performance.now();
    latencies.push(end - start);
    totalOrders++;
  } catch (error: any) {
    console.error(
      `  ${side} order failed @ ${price.toFixed(1)} ->`,
      error?.message ?? error,
    );
  }
}

async function benchmark() {
  console.log(
    `  Starting benchmark on ${MARKET} (user ${USER_ID}) for ${TEST_DURATION / 1000}s against ${BASE_URL}`,
  );
  const startTime = Date.now();

  while (Date.now() - startTime < TEST_DURATION) {
    const price = 100 + Math.random() * 10;

    await Promise.all([
      placeOrder("buy", price - Math.random()),
      placeOrder("sell", price + Math.random()),
    ]);
  }

  printStats();
}

function printStats() {
  latencies.sort((a, b) => a - b);

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log("  Total Orders:", totalOrders);
  console.log("  Orders/sec:", totalOrders / (TEST_DURATION / 1000));
  console.log("  Avg Latency:", avg.toFixed(2), "ms");
  console.log("  P95 Latency:", p95.toFixed(2), "ms");
}

benchmark();
