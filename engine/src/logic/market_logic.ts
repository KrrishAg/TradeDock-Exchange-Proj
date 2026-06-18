interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export const SUPPORTED_MARKETS = [
  "TATA_INR",
  "RELIANCE_INR",
  "AMAZON_INR",
  "WIPRO_INR",
  "GOOGLE_INR",
  "HDFC_INR",
];

export function setBaseBalances(balances: Map<String, UserBalance>) {
  const assets = SUPPORTED_MARKETS.map((m) => m.split("_")[0]);
  const users = ["1", "2", "5"];
  users.forEach((user) => {
    const userBal: UserBalance = {
      INR: {
        available: 10000000,
        locked: 0,
      },
    };

    assets.forEach((asset) => {
      userBal[asset] = {
        available: 10000000,
        locked: 0,
      };
    });

    balances.set(user, userBal);
  });
  console.log(
    `  Seeded starting balances for users`,
  );
}
