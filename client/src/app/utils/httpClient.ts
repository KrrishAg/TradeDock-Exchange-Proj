import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

// const BASE_URL = "https://api.binance.com/api/v3";
const BASE_URL =
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1` || "http://localhost:3000/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
  try {
    const response = await axios.get(`${BASE_URL}/ticker?symbol=${market}`);
    return response.data;
  } catch (e) {
    console.error(`  getTicker failed for ${market} ->`, e);
    throw e;
  }
}

export async function getDepth(market: string): Promise<Depth> {
  try {
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
    return response.data;
  } catch (e) {
    console.error(`  getDepth failed for ${market} ->`, e);
    throw e;
  }
}
export async function getTrades(market: string): Promise<Trade[]> {
  try {
    const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
    return response.data;
  } catch (e) {
    console.error(`  getTrades failed for ${market} ->`, e);
    throw e;
  }
}

export async function getKlines(
  market: string,
  interval: string,
  startTime: number,
  endTime: number,
): Promise<KLine[]> {
  try {
    const response = await axios.get(
      `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`,
    );
    const data: KLine[] = response.data;
    return data;
  } catch (e) {
    console.error(`  getKlines failed for ${market} ${interval} ->`, e);
    throw e;
  }
}

// export async function getMarkets(): Promise<string[]> {
//   const response = await axios.get(`${BASE_URL}/markets`);
//   return response.data;
// }
