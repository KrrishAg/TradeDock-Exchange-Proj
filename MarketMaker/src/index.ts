// import axios from "axios";

// const BASE_URL = "http://localhost:3000";
// const TOTAL_BIDS = 15;
// const TOTAL_ASK = 15;
// const MARKET = "WIPRO_INR";
// const USER_ID = "5"; //hardcoded the 5th user to be market maker

// async function main() {
//   const price = 100 + Math.random() * 10;
//   const openOrders: any = await axios.get(
//     `${BASE_URL}/api/v1/order/open?userId=${USER_ID}&market=${MARKET}`
//   );

//   const totalBids = openOrders.data.filter((o: any) => o.side === "buy").length;
//   const totalAsks = openOrders.data.filter(
//     (o: any) => o.side === "sell"
//   ).length;

//   const cancelledBids = await cancelBidsMoreThan(openOrders.data, price);
//   const cancelledAsks = await cancelAsksLessThan(openOrders.data, price);

//   let bidsToAdd = TOTAL_BIDS - totalBids - cancelledBids;
//   let asksToAdd = TOTAL_ASK - totalAsks - cancelledAsks;

//   while (bidsToAdd > 0 || asksToAdd > 0) {
//     if (bidsToAdd > 0) {
//       await axios.post(`${BASE_URL}/api/v1/order`, {
//         market: MARKET,
//         price: (price - Math.random() * 1).toFixed(1).toString(),
//         quantity: "1",
//         side: "buy",
//         userId: USER_ID,
//       });
//       bidsToAdd--;
//     }
//     if (asksToAdd > 0) {
//       await axios.post(`${BASE_URL}/api/v1/order`, {
//         market: MARKET,
//         price: (price + Math.random() * 1).toFixed(1).toString(),
//         quantity: "1",
//         side: "sell",
//         userId: USER_ID,
//       });
//       asksToAdd--;
//     }
//   }

//   await new Promise((resolve) => setTimeout(resolve, 1000));

//   main();
// }

// async function cancelBidsMoreThan(openOrders: any[], price: number) {
//   let promises: any[] = [];
//   openOrders.map((o) => {
//     if (o.side === "buy" && (o.price > price || Math.random() < 0.1)) {
//       promises.push(
//         axios({
//           method: "delete",
//           url: `${BASE_URL}/api/v1/order`,
//           data: {
//             orderId: o.orderId,
//             market: MARKET,
//           },
//         })
//       );
//     }
//   });
//   await Promise.all(promises);
//   return promises.length;
// }

// async function cancelAsksLessThan(openOrders: any[], price: number) {
//   let promises: any[] = [];
//   openOrders.map((o) => {
//     if (o.side === "sell" && (o.price < price || Math.random() < 0.5)) {
//       promises.push(
//         axios({
//           method: "delete",
//           url: `${BASE_URL}/api/v1/order`,
//           data: {
//             orderId: o.orderId,
//             market: MARKET,
//           },
//         })
//       );
//     }
//   });

//   await Promise.all(promises);
//   return promises.length;
// }

// main();


import axios from "axios";
import { performance } from "perf_hooks";

const BASE_URL = "http://localhost:3000";
const MARKET = "AMAZON_INR";
const USER_ID = "5";

const TEST_DURATION = 10000; // 10 seconds

let totalOrders = 0;
let latencies: number[] = [];

async function placeOrder(side: "buy" | "sell", price: number) {
  const start = performance.now();

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
}

async function benchmark() {
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

  const avg =
    latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const p95 = latencies[Math.floor(latencies.length * 0.95)];

  console.log("Total Orders:", totalOrders);
  console.log("Orders/sec:", totalOrders / (TEST_DURATION / 1000));
  console.log("Avg Latency:", avg.toFixed(2), "ms");
  console.log("P95 Latency:", p95.toFixed(2), "ms");
}

benchmark();