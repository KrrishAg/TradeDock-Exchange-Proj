export const BidTable = ({ bids }: { bids: [string, string][] }) => {
  let currentTotal = 0;
  bids.sort((a, b) => +a[0] - +b[0]);

  const currBids = bids.slice(0, 15);

  // console.log(currBids);
  const bidsWithTotal: [string, string, number][] = currBids.map(
    ([price, quantity]) => [
      price,
      quantity,
      (currentTotal += Number(quantity)),
    ],
  );

  const maxTotal = currBids.reduce(
    (acc, [, quantity]) => acc + Number(quantity),
    0,
  );

  return (
    <div>
      {bidsWithTotal?.map(([price, quantity, total]) => (
        <Bid
          maxTotal={maxTotal}
          total={total}
          key={Math.random()}
          price={price}
          quantity={quantity}
        />
      ))}
    </div>
  );
};

function Bid({
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
          background: "rgba(1, 167, 129, 0.325)",
          transition: "width 0.3s ease-in-out",
        }}
      ></div>
      <div className="grid grid-cols-[3fr_2fr_1fr] w-full">
        <div className="text-green-200">{(+price).toFixed(2)}</div>
        <div>{(+quantity).toFixed(2)}</div>
        <div>{total?.toFixed(2)}</div>
      </div>
    </div>
  );
}
