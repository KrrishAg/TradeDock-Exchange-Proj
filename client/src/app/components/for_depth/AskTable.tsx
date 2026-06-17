//asks: [price,size][]
export const AskTable = ({ asks }: { asks: [string, string][] }) => {
  let currentTotal = 0;
  asks.sort((a, b) => +b[0] - +a[0]);

  const relevantAsks = asks.reverse().slice(0, 15).reverse(); //this is because we want the asks for like the smallest price visible on screen

  const asksWithTotal: [string, string, number][] = [];
  for (let i = relevantAsks.length - 1; i >= 0; i--) {
    const [price, quantity] = relevantAsks[i];
    asksWithTotal.push([price, quantity, (currentTotal += Number(quantity))]);
  }
  const maxTotal = relevantAsks.reduce(
    (acc, [, quantity]) => acc + Number(quantity),
    0,
  );

  asksWithTotal.reverse();

  return (
    <div>
      {asksWithTotal.map(([price, quantity, total]) => (
        <Ask
          maxTotal={maxTotal}
          key={Math.random()}
          price={price}
          quantity={quantity}
          total={total}
        />
      ))}
    </div>
  );
};

function Ask({
  price,
  quantity,
  total,
  maxTotal,
}: {
  price: string;
  quantity: string;
  total: number;
  maxTotal: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: `${(100 * total) / maxTotal}%`,
          height: "100%",
          background: "rgba(228, 75, 68, 0.325)",
          transition: "width 0.3s ease-in-out",
        }}
      ></div>
      <div className="grid grid-cols-[3fr_2fr_1fr] w-full">
        <div className="text-red-200">{(+price).toFixed(2)}</div>
        <div>{(+quantity).toFixed(2)}</div>
        <div>{total?.toFixed(2)}</div>
      </div>
    </div>
  );
}
