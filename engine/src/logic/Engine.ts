import fs from "fs";
import { Fill, Order, OrderBook } from "./OrderBook";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  MessageFromApi,
  ON_RAMP,
} from "../types/fromApi";
import { RedisManager } from "../RedisManager";
import { setBaseBalances, SUPPORTED_MARKETS } from "./market_logic";

interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export const QUOTE_CURRENCY = "INR";
const BASE_ASSET = "TATA";

export class Engine {
  private orderbooks: OrderBook[] = [];
  private balances: Map<String, UserBalance> = new Map();

  //manages the snapshoit file
  constructor() {
    let snapshot;
    try {
      snapshot = fs.readFileSync("./snapshot.json");
    } catch (error) {
      console.log("  No snapshot found, starting fresh");
    }

    //if the file already exists, that means my BE ran before, restore the previous state
    if (snapshot) {
      const snapshotFromFile = JSON.parse(snapshot.toString());
      this.orderbooks = snapshotFromFile.orderbooks.map(
        (o: any) =>
          new OrderBook(
            o.baseAsset,
            o.bids,
            o.asks,
            o.lastTradeId,
            o.currentPrice,
          ),
      );
      this.balances = new Map(snapshotFromFile.balances);
      console.log(
        `  Restored from snapshot: ${this.orderbooks.length} orderbooks, ${this.balances.size} user balances`,
      );
    } else {
      //otherwise start from the start
      this.orderbooks = SUPPORTED_MARKETS.map(
        (m) => new OrderBook(m.split("_")[0], [], [], 0, 0),
      );
      console.log("  Initialized orderbooks:", SUPPORTED_MARKETS.join(", "));
      setBaseBalances(this.balances);
    }

    //saves the snapshot every 3 seconds to update it
    setInterval(() => {
      this.saveSnapshot();
    }, 3 * 1000);
  }

  //used to modify the snapshot file, keep updating it with the latest data
  saveSnapshot() {
    const snapshotToSave = {
      orderbooks: this.orderbooks.map((xx) => xx.getSnapShot()),
      balances: Array.from(this.balances.entries()),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotToSave));
  }

  //this acts as a ROUTER, depending on message.type, it calls the relevant set of functions and also talks with redis
  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    console.log(`  Received ${message.type} (client ${clientId})`);
    switch (message.type) {
      case CREATE_ORDER:
        try {
          const { executedQty, fills, orderId } = this.createOrder(
            message.data.market,
            message.data.quantity,
            message.data.price,
            message.data.side,
            message.data.userId,
          );

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              executedQty,
              fills,
              orderId,
            },
          });
        } catch (error) {
          console.error("  Failed to create order ->", error);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
            },
          });
        }
        break;
      case CANCEL_ORDER:
        try {
          const orderId = message.data.orderId;
          const cancelMarket = message.data.market;

          const cancelOrderbook = this.orderbooks.find(
            (xx) => xx.ticker() === cancelMarket,
          );
          if (!cancelOrderbook) {
            console.warn("  Cancel failed: no orderbook for", cancelMarket);
            throw new Error("No orderbook found");
          }

          const order =
            cancelOrderbook?.asks.find((xx) => xx.orderId === orderId) ||
            cancelOrderbook?.bids.find((xx) => xx.orderId === orderId);
          if (!order) {
            console.warn(
              "  Cancel failed: no order",
              orderId,
              "in",
              cancelMarket,
            );
            throw new Error("No such order Id found");
          }

          const quoteAsset = cancelMarket.split("_")[1];

          if (order.side === "buy") {
            //change the quote asset
            const leftQuantityPrice =
              (order.quantity - order.filled) * order.price;

            //I am moving this amount from locked back to available
            //@ts-ignore
            this.balances.get(order.userId)[quoteAsset].available +=
              leftQuantityPrice;
            //@ts-ignore
            this.balances.get(order.userId)[quoteAsset].locked -=
              leftQuantityPrice;

            //actually removces the order from the orderbook
            const price = cancelOrderbook?.cancelBid(order);
            //this price is returned only if the cancellation was sucessful
            if (price) {
              //to show the updated quantity on UI
              this.sendUpdatedDepth(price.toString(), cancelMarket);
            }
          } else {
            //only chnage the quantity as dealing with base asset
            const leftQuantityPrice = order.quantity - order.filled;

            //I am moving this quantity from locked back to available
            //@ts-ignore
            this.balances.get(order.userId)[BASE_ASSET].available +=
              leftQuantityPrice;
            //@ts-ignore
            this.balances.get(order.userId)[BASE_ASSET].locked -=
              leftQuantityPrice;

            const price = cancelOrderbook?.cancelAsk(order);
            if (price) {
              this.sendUpdatedDepth(price.toString(), cancelMarket);
            }
          }

          console.log(`  Order cancelled: ${orderId} on ${cancelMarket}`);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId,
              remainingQty: 0,
              executedQty: 0,
            },
          });
        } catch (error) {
          console.error("  Failed to cancel order ->", error);
        }
      case GET_OPEN_ORDERS:
        try {
          const openOrderBook = this.orderbooks.find(
            (xx) => xx.ticker() === message.data.market,
          );
          if (!openOrderBook) throw new Error("No orderbook/market like that");

          const openOrders = openOrderBook.getOpenOrders(clientId);
          console.log(
            `  Open orders for ${message.data.market}: ${openOrders.length}`,
          );
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders,
          });
        } catch (error) {
          console.error("  Failed to fetch open orders ->", error);
        }
        break;
      case GET_DEPTH:
        try {
          const OrderBook = this.orderbooks.find(
            (xx) => xx.ticker() === message.data.market,
          );
          if (!OrderBook) throw new Error("No orderbook/market like that");

          const depth = OrderBook.getDepth();

          console.log(
            `  Depth for ${message.data.market}: ${depth.bids.length} bids, ${depth.asks.length} asks`,
          );

          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: depth,
          });
        } catch (error) {
          console.error("  Failed to get depth ->", error);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              bids: [],
              asks: [],
            },
          });
        }
        break;
      case ON_RAMP:
        const userId = message.data.userId;
        const amount = Number(message.data.amount);
        this.onRamp(userId, amount);
        break;
    }
  }

  //if need
  addOrderBook(orderBook: OrderBook) {
    this.orderbooks.push(orderBook);
  }

  createOrder(
    market: string,
    quantity: string,
    price: string,
    side: "buy" | "sell",
    userId: string,
  ) {
    //first find the right orderbook
    const orderBook = this.orderbooks.find((xx) => xx.ticker() === market);
    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];

    if (!orderBook) {
      throw new Error("No orderbook found");
    }

    //to check if user can afford the trade
    this.verifyAndLockFunds(
      baseAsset,
      quoteAsset,
      price,
      quantity,
      userId,
      side,
    );

    //create the order object
    const order: Order = {
      price: +price,
      quantity: +quantity,
      filled: 0,
      side,
      userId,
      orderId:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
    };

    //adds order to the right orderbook, returns how much rder was filled and the fills which helped to complete that order
    const { fills, executedQty } = orderBook.addOrder(order);

    //actually moves the money
    this.updateBalances(
      baseAsset,
      quoteAsset,
      price,
      quantity,
      userId,
      side,
      fills,
    );
    //update db about trades and orders
    this.createDbTrades(fills, market, userId, side);
    this.updateDbOrders(fills, order, executedQty, market);

    //inform the FrontEnd about everything going on
    this.publishWsTrades(market, userId, fills, side);
    this.publishWsDepthUpdates(fills, price, side, market);
    this.publishWsTicker(market, fills);
    console.log(
      `  Order matched: ${side} ${quantity} ${market} @ ${price} (user ${userId}) -> executedQty=${executedQty}, ${fills.length} fill(s)`,
    );

    return { executedQty, fills, orderId: order.orderId };
  }

  //sending the message via redis to update db order
  updateDbOrders(
    fills: Fill[],
    order: Order,
    executedQty: number,
    market: string,
  ) {
    //adding the requested order i.e. the taker's order
    RedisManager.getInstance().pushMessage({
      type: "ORDER_UPDATE",
      data: {
        orderId: order.orderId,
        executedQty: executedQty,
        market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    //adding the fills which tried to completed that order,
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: "ORDER_UPDATE",
        data: {
          orderId: fill.markerOrderId, //this is the id of the maker
          executedQty: fill.qty, //
        },
      });
    });
  }

  //Send messages to queue to add the trade to the DB
  createDbTrades(
    fills: Fill[],
    market: string,
    userId: string,
    side: "buy" | "sell",
  ) {
    fills.forEach((fill) => {
      //each fill etting added as a sepasrate trade
      RedisManager.getInstance().pushMessage({
        type: "TRADE_ADDED",
        data: {
          id: fill.tradeId.toString(),
          isBuyerMaker: side === "sell",
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
          market,
        },
      });
    });
  }

  //used to Publish real-time event data to a Redis for FRONTEND. these data keys, the way I used them in client, like how binance used to give
  publishWsTrades(
    market: string,
    userId: string,
    fills: Fill[],
    side: "buy" | "sell",
  ) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(
        `${market.toLowerCase()}@trade`,
        {
          stream: `${market.toLowerCase()}@trade`,
          data: {
            tradeId: fill.tradeId,
            isBuyerMaker: side === "sell", //isBuyerMkaer will be true if the guy who is buying was lready on thje orderbook, like the one DIDNOT initialize the trade
            price: fill.price,
            qty: fill.qty.toString(),
            time: Date.now(),
            e: "trade",
          },
        },
      );
    });
  }

  publishWsTicker(market: string, fills: Fill[]) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(
        `${market.toLowerCase()}@ticker`,
        {
          stream: `${market.toLowerCase()}@ticker`,
          data: {
            lastPrice: fill.price,
            e: "24hrTicker",
          },
        },
      );
    });
  }

  //mainly used in order cancellation to inform the UI, like when user deleted his order, the depth from orderBook already has updated asks and bids, just update the FE using websockets, so only return the updated bids and asks FOR THAT PRICE
  sendUpdatedDepth(price: string, market: string) {
    const orderBook = this.orderbooks.find((xx) => xx.ticker() === market);
    if (!orderBook) {
      throw new Error("No such orderbook available");
    }

    const depth = orderBook.getDepth();
    const updatedBids = depth.bids.filter((xx) => xx[0] === price);
    const updatedAsks = depth.asks.filter((xx) => xx[0] === price);

    RedisManager.getInstance().publishMessage(
      `${market.toLowerCase()}@depth@100ms`,
      {
        stream: `${market.toLowerCase()}@depth@100ms`,
        data: {
          b: updatedBids.length ? updatedBids : [[price, "0"]],
          a: updatedAsks.length ? updatedAsks : [[price, "0"]],
          e: "depthUpdate",
        },
      },
    );
  }

  //used to Publish real-time event data to a Redis for FRONTEND.
  publishWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string,
  ) {
    const orderBook = this.orderbooks.find((xx) => xx.ticker() === market);
    if (!orderBook) {
      throw new Error("No such orderbook available");
    }

    //gets the final state of the depth chart AFTER the trades.
    const depth = orderBook.getDepth();

    if (side === "buy") {
      //get the prices which are filling this buy order
      const filledPrices = fills.map((fill) => fill.price);

      //the asks which have been updated
      const updatedAsks = depth.asks.filter((x) => filledPrices.includes(x[0]));

      //if the og buy order is not yet completed, we need to tell the FE about it
      const updatedBid = depth.bids.find((x) => x[0] === price);

      RedisManager.getInstance().publishMessage(
        `${market.toLowerCase()}@depth@100ms`,
        {
          stream: `${market.toLowerCase()}@depth@100ms`,
          data: {
            a: depth.asks,
            b: depth.bids,
            e: "depthUpdate",
          },
        },
      );
    } else {
      const filledPrices = fills.map((fill) => fill.price);
      const updatedBids = depth.bids.filter((x) => filledPrices.includes(x[0]));
      const updatedAsk = depth.asks.find((x) => x[0] === price);

      RedisManager.getInstance().publishMessage(
        `${market.toLowerCase()}@depth@100ms`,
        {
          stream: `${market.toLowerCase()}@depth@100ms`,
          data: {
            a: depth.asks,
            b: depth.bids,
            e: "depthUpdate",
          },
        },
      );
    }
  }

  //A "post-trade" function actually changing the money and assets between the buyer and the seller, finalizing the transaction.
  //once verified, our money/asset is in locked, so when exchange happens, for the one who is giving, locjked value decreases, and available one increases
  updateBalances(
    baseAsset: string,
    quoteAsset: string,
    price: string,
    quantity: string,
    userId: string,
    side: "buy" | "sell",
    fills: Fill[],
  ) {
    if (side === "buy") {
      fills.forEach((fill) => {
        //upfating quote asset

        //increase money for the seller
        //@ts-ignore
        this.balances.get(fill.otherUserId)[quoteAsset].available =
          (this.balances.get(fill.otherUserId)?.[quoteAsset]?.available || 0) +
          fill.qty * Number(fill.price);

        //decrese balance of the user from locked who is buying that is userId
        //@ts-ignore
        this.balances.get(userId)[quoteAsset].locked =
          (this.balances.get(userId)?.[quoteAsset]?.locked || 0) -
          fill.qty * Number(fill.price);

        //updating base assets

        //decrese baseasset of the seller from locked
        //@ts-ignore
        this.balances.get(fill.otherUserId)[baseAsset].locked =
          (this.balances.get(fill.otherUserId)?.[baseAsset]?.locked || 0) -
          fill.qty;

        //increase asset for userID
        //@ts-ignore
        this.balances.get(userId)[baseAsset].available =
          (this.balances.get(userId)?.[baseAsset]?.available || 0) + fill.qty;
      });
    } else {
      fills.forEach((fill) => {
        //updating quote assets

        //@ts-ignore
        this.balances.get(fill.otherUserId)[quoteAsset].locked =
          (this.balances.get(fill.otherUserId)?.[quoteAsset]?.locked || 0) -
          fill.qty * Number(fill.price);

        //@ts-ignore
        this.balances.get(userId)[quoteAsset].available =
          (this.balances.get(userId)?.[quoteAsset]?.available || 0) +
          fill.qty * Number(fill.price);

        //updating base assets

        //@ts-ignore
        this.balances.get(fill.otherUserId)[baseAsset].available =
          (this.balances.get(fill.otherUserId)?.[baseAsset]?.available || 0) +
          fill.qty;

        //@ts-ignore
        this.balances.get(userId)[baseAsset].locked =
          (this.balances.get(userId)?.[baseAsset]?.locked || 0) - fill.qty;
      });
    }
  }

  //this is a "pre-trade" check to ensure that a user actually has enough available funds for an order.
  verifyAndLockFunds(
    baseAsset: string,
    quoteAsset: string,
    price: string,
    quantity: string,
    userId: string,
    side: "buy" | "sell",
  ) {
    if (side === "buy") {
      //for a buy order, the user must have the sufficient money in their avl balance
      if (
        (this.balances.get(userId)?.[quoteAsset]?.available || 0) <
        Number(price) * Number(quantity)
      ) {
        console.warn(
          `  Insufficient ${quoteAsset} for user ${userId} (need ${Number(price) * Number(quantity)})`,
        );
        throw new Error("Insufficient quote currency");
      }

      //moving the money from avl to locked, so that dont use same omount on two assets
      //@ts-ignore
      this.balances.get(userId)[quoteAsset].available =
        (this.balances.get(userId)?.[quoteAsset]?.available || 0) -
        Number(price) * Number(quantity);

      //@ts-ignore
      this.balances.get(userId)[quoteAsset].locked =
        (this.balances.get(userId)?.[quoteAsset]?.locked || 0) +
        Number(price) * Number(quantity);
    } else {
      //for a sell order, it checks if user has sufficient quanitity of base asset in avl
      if (
        (this.balances.get(userId)?.[baseAsset]?.available || 0) <
        Number(quantity)
      ) {
        console.warn(
          `  Insufficient ${baseAsset} for user ${userId} (need ${Number(quantity)})`,
        );
        throw new Error("Insufficient base asset");
      }

      //moving the asset from avl to locked
      //@ts-ignore
      this.balances.get(userId)[baseAsset].available =
        (this.balances.get(userId)?.[baseAsset]?.available || 0) -
        Number(quantity);

      //@ts-ignore
      this.balances.get(userId)[baseAsset].locked =
        (this.balances.get(userId)?.[baseAsset]?.locked || 0) +
        Number(quantity);
    }
  }

  //depositing money (INR) into the exchange so that user can use it
  onRamp(userId: string, amount: number) {
    console.log(`  On-ramp: +${amount} ${QUOTE_CURRENCY} for user ${userId}`);
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      this.balances.set(userId, {
        [QUOTE_CURRENCY]: {
          available: amount,
          locked: 0,
        },
        [BASE_ASSET]: {
          available: 0,
          locked: 0,
        },
      });
    } else {
      userBalance[QUOTE_CURRENCY].available += amount;
    }
  }
}
