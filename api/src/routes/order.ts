import express from "express";
import { RedisManager } from "../RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS } from "../types";

export const orderRouter = express.Router();

orderRouter.post("/", async (req, res) => {
  const { market, price, quantity, side, userId } = req.body;
  console.log("Ordering -> ", price, market, quantity, side, userId);
  if (price <= 0) {
    return res.json({ message: "The price must be a positive number" });
  }
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_ORDER,
    data: {
      market,
      price,
      quantity,
      side,
      userId,
    },
  });
  // console.log(response);
  res.json(response.payload);
});

orderRouter.delete("/", async (req, res) => {
  const { orderId, market } = req.body;
  console.log("Deleting order -> ", orderId, market);
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CANCEL_ORDER,
    data: {
      orderId,
      market,
    },
  });
  res.json(response.payload);
});

orderRouter.get("/open", async (req, res) => {
  const { userId, market } = req.query;
  // console.log(userId, market);
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_OPEN_ORDERS,
    data: {
      market: market as string,
      userId: userId as string,
    },
  });
  res.json(response.payload);
});
