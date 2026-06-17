"use client";

import Link from "next/link";
import { supportedMarkets } from "../utils/data";
import { signOut } from "next-auth/react";
import Image from "next/image";

//list of markets

export default function Home() {
  return (
    <div className="flex justify-center">
      <button
        className="absolute right-10 top-20 bg-red-800 py-1 px-2 rounded-lg text-red-100"
        onClick={async () => {
          await signOut({ callbackUrl: "/" });
        }}
      >
        SignOut
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 w-400 gap-4 p-8 pt-16">
        {supportedMarkets.map((market) => (
          <Link key={market.name} href={`trade/${market.name}`}>
            <div className="bg-gray-800 p-10 h-40 rounded-lg flex gap-10 items-center space-x-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200">
              <Image
                src={market.icon}
                alt={market.base}
                className="w-20 h-20 rounded-full"
              />
              <div className="flex flex-col gap-3">
                <p className="text-2xl lg:text-3xl font-bold text-white">
                  {market.base} / {market.quote}
                </p>
                <p className="text-gray-400">Trade Now &rarr;</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
