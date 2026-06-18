"use client";
import axios from "axios";
import Image from "next/image";
import { useState } from "react";

export function SwapUI({ market, userId }: { market: string; userId: string }) {
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("0");
  const [activeTab, setActiveTab] = useState("buy");
  const [type, setType] = useState("limit");
  const api_url =
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/order` ||
    "http://localhost:3000/api/v1/order";

  function makeOrder() {
    console.log(
      `  Placing ${activeTab} order: ${quantity} ${market} at price ${price}`,
    );
    axios
      .post(api_url, {
        market,
        price,
        quantity,
        side: activeTab,
        userId,
      })
      .then((res) => console.log("  Order response ->", res.data))
      .catch((e) => console.error("  Order failed ->", e));
  }

  return (
    <div>
      <div className="flex flex-col">
        <div className="flex flex-row h-[60px]">
          <BuyButton activeTab={activeTab} setActiveTab={setActiveTab} />
          <SellButton activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="px-3">
            <div className="flex flex-row flex-0 gap-5 undefined">
              <LimitButton type={type} setType={setType} />
              <MarketButton type={type} setType={setType} />
            </div>
          </div>
          <div className="flex flex-col px-3">
            <div className="flex flex-col flex-1 gap-3 text-baseTextHighEmphasis">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-normal text-baseTextMedEmphasis">
                  Price
                </p>
                <div className="flex flex-col relative">
                  <input
                    step="0.01"
                    placeholder="0"
                    className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-blue-400 focus:ring-0"
                    type="text"
                    defaultValue="0"
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <div className="flex flex-row absolute right-1 bottom-1 p-2">
                    <div className="relative">
                      <Image
                        width={50}
                        height={50}
                        alt="Quote Asset Logo"
                        loading="lazy"
                        decoding="async"
                        data-nimg="1"
                        className="z-10 rounded-full h-6 w-6 mt-4 outline-baseBackgroundL1"
                        src={`/icons/${market.toLowerCase().split("_")[1]}.png`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-normal text-baseTextMedEmphasis">
                Quantity
              </p>
              <div className="flex flex-col relative">
                <input
                  step="0.01"
                  placeholder="0"
                  className="h-12 rounded-lg border-2 border-solid border-baseBorderLight bg-[var(--background)] pr-12 text-right text-2xl leading-9 text-[$text] placeholder-baseTextMedEmphasis ring-0 transition focus:border-blue-400 focus:ring-0"
                  type="text"
                  defaultValue="0"
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <div className="flex flex-row absolute right-1 bottom-1 p-2">
                  <div className="relative">
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
                  </div>
                </div>
              </div>
              <div className="flex justify-end flex-row">
                <p className="font-medium pr-2 text-xs text-baseTextMedEmphasis">
                  ≈ {+price * +quantity} INR
                </p>
              </div>
              <div className="flex justify-center flex-row mt-2 gap-3">
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                  25%
                </div>
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                  50%
                </div>
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                  75%
                </div>
                <div className="flex items-center justify-center flex-row rounded-full px-[16px] py-[6px] text-xs cursor-pointer bg-baseBackgroundL2 hover:bg-baseBackgroundL3">
                  Max
                </div>
              </div>
            </div>
            {activeTab === "buy" ? (
              <button
                type="button"
                className="font-bold  focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-green-400 text-black active:scale-98"
                onClick={makeOrder}
              >
                Buy
              </button>
            ) : (
              <button
                type="button"
                className="font-bold  focus:ring-blue-200 focus:none focus:outline-none text-center h-12 rounded-xl text-base px-4 py-2 my-4 bg-red-400 text-black active:scale-98"
                onClick={makeOrder}
              >
                Sell
              </button>
            )}
            <div className="flex justify-between flex-row mt-1">
              <div className="flex flex-row gap-2">
                <div className="flex items-center">
                  <input
                    className="form-checkbox rounded border border-solid border-baseBorderMed bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent checked:border-baseBorderMed checked:bg-base-900 checked:hover:border-baseBorderMed focus:bg-base-900 focus:ring-0 focus:ring-offset-0 focus:checked:border-baseBorderMed cursor-pointer h-5 w-5"
                    id="postOnly"
                    type="checkbox"
                    data-rac=""
                  />
                  <label className="ml-2 text-xs">Post Only</label>
                </div>
                <div className="flex items-center">
                  <input
                    className="form-checkbox rounded border border-solid border-baseBorderMed bg-base-950 font-light text-transparent shadow-none shadow-transparent outline-none ring-0 ring-transparent checked:border-baseBorderMed checked:bg-base-900 checked:hover:border-baseBorderMed focus:bg-base-900 focus:ring-0 focus:ring-offset-0 focus:checked:border-baseBorderMed cursor-pointer h-5 w-5"
                    id="ioc"
                    type="checkbox"
                    data-rac=""
                  />
                  <label className="ml-2 text-xs">IOC</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex flex-col cursor-pointer justify-center py-2"
      onClick={() => setType("limit")}
    >
      <div
        className={`text-sm font-medium py-1 border-b-2 ${
          type === "limit"
            ? "border-blue-400 text-baseTextHighEmphasis"
            : "border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"
        }`}
      >
        Limit
      </div>
    </div>
  );
}

function MarketButton({ type, setType }: { type: string; setType: any }) {
  return (
    <div
      className="flex flex-col cursor-pointer justify-center py-2"
      onClick={() => setType("market")}
    >
      <div
        className={`text-sm font-medium py-1 border-b-2 ${
          type === "market"
            ? "border-blue-400 text-baseTextHighEmphasis"
            : "border-b-2 border-transparent text-baseTextMedEmphasis hover:border-baseTextHighEmphasis hover:text-baseTextHighEmphasis"
        } `}
      >
        Market
      </div>
    </div>
  );
}

function BuyButton({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: any;
}) {
  return (
    <div
      className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${
        activeTab === "buy"
          ? "border-b-greenBorder bg-green-200"
          : "border-b-baseBorderMed hover:border-b-baseBorderFocus"
      }`}
      onClick={() => setActiveTab("buy")}
    >
      <p className="text-center text-sm font-semibold text-green-500">Buy</p>
    </div>
  );
}

function SellButton({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: any;
}) {
  return (
    <div
      className={`flex flex-col mb-[-2px] flex-1 cursor-pointer justify-center border-b-2 p-4 ${
        activeTab === "sell"
          ? "border-b-redBorder bg-red-200"
          : "border-b-baseBorderMed hover:border-b-baseBorderFocus"
      }`}
      onClick={() => setActiveTab("sell")}
    >
      <p className="text-center text-sm font-semibold text-red-500">Sell</p>
    </div>
  );
}
