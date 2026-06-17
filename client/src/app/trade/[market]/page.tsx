"use client";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUi";
import { TradeView } from "@/app/components/TradeView";
import { Trades } from "@/app/components/Trades";
import { Depth } from "@/app/components/for_depth/Depth";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const { data, status } = useSession();
  const router = useRouter();

  const { market }: { market: string } = useParams();

  //to replace the _, as binance needs no _, but I need that for images
  // const marketName = market.replace("_", "") || "";

  const [activeTab, setActiveTab] = useState<string>("Book");

  useEffect(() => {
    if (status === "loading") return;
    else if (!data) router.push("/");
  }, [status, data, router]);

  if (!data) return;

  // console.log(data);

  return (
    <div className="flex flex-col lg:flex-row flex-1">
      <div className="flex flex-col flex-1">
        <MarketBar market={market} />
        <div className="flex flex-col lg:flex-row gap-10 md:gap-2 border-y border-slate-800">
          {/* first */}
          <div className="flex flex-col flex-1">
            <TradeView market={market} />
          </div>
          <div className="w-[1px] flex-col border-slate-800 border-l"></div>
          <div className="flex flex-col md:flex-row md:justify-center gap-10 lg:gap-2">
            {/* second */}
            <div className="p-2 flex flex-col self-center lg:self-start gap-2 w-[350px] lg:w-[250px] h-[700px] overflow-auto">
              <div className="flex gap-4">
                <div
                  className={`${
                    activeTab === "Book" ? "bg-gray-700" : "text-slate-400"
                  } hover:bg-gray-800 py-1 px-2 rounded-lg cursor-pointer`}
                  onClick={() => setActiveTab("Book")}
                >
                  Book
                </div>
                <div
                  className={`${
                    activeTab === "Trades" ? "bg-gray-700" : "text-slate-400"
                  } hover:bg-gray-800 py-1 px-2 rounded-lg cursor-pointer`}
                  onClick={() => setActiveTab("Trades")}
                >
                  Trades
                </div>
              </div>
              {activeTab === "Book" ? (
                <Depth market={market} />
              ) : (
                <Trades market={market} />
              )}
            </div>
            {/* third */}
            <div className="flex flex-col self-center lg:self-start w-[350px] lg:w-[250px]">
              <SwapUI market={market} userId={(data.user as any).userId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
