"use client";
import { useEffect, useState } from "react";
import { Ticker } from "../utils/types";
import { getTicker } from "../utils/httpClient";
import Image from "next/image";
import { WSClient } from "../utils/RealTimeUtil";

export const MarketBar = ({ market }: { market: string }) => {
  const [ticker, setTicker] = useState<Ticker | null>(null);

  //this is so that when we mount the Marketbar, we register for the event ticker which then runs the cllback fn which actually expects data Ticker and then updat teh ticker for Marketbar using setTicker
  useEffect(() => {
    getTicker(market).then(setTicker);

    WSClient.getInstance().registerCallBack(
      "24hrTicker", //this type chosen as this is the type in the event.data.e is what we get
      (data: Partial<Ticker>) => {
        setTicker(() => ({
          lastPrice: data?.lastPrice ?? "",
        }));
      },
      `TICKER-${market}`
    );

    WSClient.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [
        `${market.toLowerCase()}@ticker`,
        `${market.toLowerCase()}@trade`,
        `${market.toLowerCase()}@depth@100ms`,
      ],
    });

    return () => {
      WSClient.getInstance().deRegisterCallBack(
        "24hrTicker",
        `TICKER-${market}`
      );
      WSClient.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [
          `${market.toLowerCase()}@ticker`,
          `${market.toLowerCase()}@trade`,
          `${market.toLowerCase()}@depth@100ms`,
        ],
      });
      WSClient.getInstance().deRegisterCallBack("trade", `trade-${market}`);
      WSClient.getInstance().deRegisterCallBack(
        "depthUpdate",
        `depth-${market}`
      );
    };
  }, [market]);

  return (
    <div>
      <div className="flex items-center p-2 flex-row relative w-full overflow-hidden border-b border-slate-800">
        <div className="flex items-center justify-between gap-15 flex-row no-scrollbar overflow-auto pr-4">
          <TickerFn market={market} />
          <div className="flex flex-col h-full text-2xl justify-center">
            <p
              className={`font-medium tabular-nums text-greenText text-sm md:text-2xl text-green-500`}
            >
              {isNaN(Number(ticker?.lastPrice))
                ? "No Trade Yet"
                : `₹${Number(ticker?.lastPrice).toFixed(2)}`}
            </p>
            <p className="font-medium text-xs md:text-xl tabular-nums">
              {isNaN(Number(ticker?.lastPrice))
                ? "No Trade Yet"
                : `₹${Number(ticker?.lastPrice).toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

function TickerFn({ market }: { market: string }) {
  return (
    <div className="flex gap-10 h-[60px] shrink-0 space-x-4">
      <div className="flex flex-row relative ml-2 -mr-4">
        <Image
          width={100}
          height={100}
          alt="Base Asset Logo"
          loading="lazy"
          decoding="async"
          data-nimg="1"
          className="z-10 rounded-full h-6 w-6 mt-4 outline-baseBackgroundL1"
          src={`/icons/${market.toLowerCase().split("_")[0]}.png`}
        />
        <Image
          width={100}
          height={100}
          alt="Quote Asset Logo"
          loading="lazy"
          decoding="async"
          data-nimg="1"
          className="h-6 w-6 -ml-2 mt-4 rounded-full"
          src={`/icons/${market.toLowerCase().split("_")[1]}.png`}
        />
      </div>
      <button type="button" className="react-aria-Button" data-rac="">
        <div className="flex items-center justify-between flex-row cursor-pointer rounded-lg p-3 hover:opacity-80">
          <div className="flex items-center flex-row undefined">
            <div className="flex flex-row relative">
              <p className="font-bold undefined">
                {market.replace("_", " / ")}
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
