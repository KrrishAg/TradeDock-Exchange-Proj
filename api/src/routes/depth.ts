import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_DEPTH } from "../types";

export const depthRouter = Router();

depthRouter.get("/", async (req, res) => {
  const { symbol } = req.query;
  console.log(" GET /depth ->", symbol);
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_DEPTH,
    data: {
      market: symbol as string,
    },
  });
  const payload = response.payload as { bids?: unknown[]; asks?: unknown[] };
  res.json(response.payload);
});
