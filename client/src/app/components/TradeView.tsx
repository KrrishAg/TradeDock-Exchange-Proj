import { useEffect, useRef } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { KLine } from "../utils/types";

export function TradeView({ market }: { market: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);

  useEffect(() => {
    const init = async () => {
      let klineData: KLine[] = [];
      try {
        klineData = await getKlines(
          market,
          "1m",
          Math.floor((new Date().getTime() - 1000 * 60 * 60 * 24 * 30) / 1000),
          Math.floor(new Date().getTime() / 1000),
        );
      } catch (e) {
        console.error(
          `  Failed to load klines for ${market}, chart can be empty ->`,
          e,
        );
      }

      if (chartRef) {
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
        }
        const chartManager = new ChartManager(
          chartRef.current,
          [
            ...klineData?.map((x) => ({
              close: +x[4], //close or latest price //got to know these indices from binance docs: https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Kline-Candlestick-Data
              high: +x[2], //highest price touched
              low: +x[3], //lowest price touched
              open: +x[1], //open price
              timestamp: new Date(x[0]), //open time
            })),
          ].sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1)) || [],
          {
            background: "#0e0f14",
            color: "white",
          },
        );
        chartManagerRef.current = chartManager;
      }
    };

    init();
  }, [market, chartRef]);

  return (
    <>
      <div
        ref={chartRef}
        style={{ height: "520px", width: "100%", marginTop: 4 }}
      ></div>
    </>
  );
}
