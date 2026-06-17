import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

// const BASE_URL = "https://api.binance.com/api/v3";
const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1` || "http://localhost:3000/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
  const response = await axios.get(`${BASE_URL}/ticker?symbol=${market}`);
  return response.data;
}

export async function getDepth(market: string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
  return response.data;
}
export async function getTrades(market: string): Promise<Trade[]> {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  return response.data;
}

export async function getKlines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<KLine[]> {
  const response = await axios.get(
    `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`
  );
  // console.log("response for klines", response);
  const data: KLine[] = response.data;
  // console.log("data from klines router", data);
  return data;
  // return data.sort((x, y) => Number(x[0]) - Number(y[0]));
}

// export async function getMarkets(): Promise<string[]> {
//   const response = await axios.get(`${BASE_URL}/markets`);
//   return response.data;
// }
