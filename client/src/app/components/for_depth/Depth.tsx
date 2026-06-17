"use client";

import { useEffect, useState } from "react";
import { getDepth, getTicker } from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { WSClient } from "@/app/utils/RealTimeUtil";
import type { Depth, Ticker } from "@/app/utils/types";

export function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [price, setPrice] = useState<string>();

  useEffect(() => {
    getDepth(market).then((d) => {
      setBids(d.bids.reverse());
      setAsks(d.asks);
    });

    getTicker(market).then((t) => setPrice(t.lastPrice));

    WSClient.getInstance().registerCallBack(
      "depthUpdate",
      (data: Depth) => {
        setBids(data.bids);
        setAsks(data.asks);
      },
      `depth-${market}`
    );

    //for the last price
    //see that I didnt subsribe to ticker here, so it is still getting vals from the MarketBar ticker sub
    WSClient.getInstance().registerCallBack(
      "24hrTicker", //this type chosen as this is the type in the event.data.e is what we get
      (data: Partial<Ticker>) =>
        setPrice((prevPrice) => data?.lastPrice ?? prevPrice ?? ""),
      `TICKER-DEPTH-${market}`
    );

    return () => {};
  }, [market]);

  return (
    <div className="overflow-y-auto no-scrollbar">
      <TableHeader />
      {asks && <AskTable asks={asks} />}
      {price && !isNaN(Number(price)) && (
        <div className="text-2xl">{(+price).toFixed(2)}</div>
      )}
      {bids && <BidTable bids={bids} />}
    </div>
  );
}

function TableHeader() {
  return (
    <div className="grid grid-cols-[3fr_2fr_1fr]">
      <div className="text-white">Price</div>
      <div className="text-slate-500">Size</div>
      <div className="text-slate-500">Total</div>
    </div>
  );
}
