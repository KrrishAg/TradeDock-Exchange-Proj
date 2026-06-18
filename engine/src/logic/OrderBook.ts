import { QUOTE_CURRENCY } from "./Engine";

export interface Order {
  price: number;
  quantity: number;
  orderId: string;
  userId: string;
  side: "buy" | "sell";
  filled: number;
}

export interface Fill {
  price: string;
  qty: number;
  otherUserId: string;
  tradeId: number;
  markerOrderId: string;
}

export class OrderBook {
  //these asks and bids array carry all the asks and bids made by users with their data as well, have a separate fn for the depth
  bids: Order[];
  asks: Order[];
  baseAsset: string;
  quoteAsset: string = QUOTE_CURRENCY;
  lastTradeId: number;
  currentPrice: number;

  constructor(
    baseAsset: string,
    bids: Order[],
    asks: Order[],
    lastTradeId: number,
    currentPrice: number
  ) {
    this.bids = bids;
    this.asks = asks;
    this.baseAsset = baseAsset;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;
  }

  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  getSnapShot() {
    return {
      bids: this.bids,
      asks: this.asks,
      baseAsset: this.baseAsset,
      currentPrice: this.currentPrice,
      lastTradeId: this.lastTradeId,
    };
  }

  addOrder(order: Order) {
    //updating the filled property of the order and then pushing it into the in memory asks or bids only if order not fulfilled with current orderbook
    if (order.side === "buy") {
      const { executedQty, fills } = this.matchBid(order);
      order.filled = executedQty;
      if (order.filled === order.quantity) {
        return {
          executedQty,
          fills,
        };
      }
      this.bids.push(order);
      return {
        executedQty,
        fills,
      };
    } else {
      const { executedQty, fills } = this.matchAsk(order);
      order.filled = executedQty;
      if (order.filled === order.quantity) {
        return {
          executedQty,
          fills,
        };
      }
      this.asks.push(order);
      return {
        executedQty,
        fills,
      };
    }
  }

  //match the bid in order as per the current asks
  matchBid(order: Order) {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.asks.length; i++) {
      if (executedQty < order.quantity && order.price >= this.asks[i].price) {
        //to avoid self-transfers
        if (this.asks[i].userId === order.userId) continue;

        const quantityGiven = Math.min(
          order.quantity - executedQty,
          this.asks[i].quantity - this.asks[i].filled
        );
        executedQty += quantityGiven;
        this.asks[i].filled += quantityGiven;

        fills.push({
          price: String(this.asks[i].price),
          qty: quantityGiven,
          tradeId: this.lastTradeId++,
          otherUserId: this.asks[i].userId,
          markerOrderId: this.asks[i].orderId,
        });
      }
    }

    //removing those asks where utilized all the qty that teher was
    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i].filled === this.asks[i].quantity) {
        this.asks.splice(i, 1);
        i--;
      }
    }

    return {
      fills,
      executedQty,
    };
  }

  //match the ask in order as per the current bids
  matchAsk(order: Order) {
    const fills: Fill[] = [];
    let executedQty = 0;

    for (let i = 0; i < this.bids.length; i++) {
      //to avoid self-transfers
      if (this.bids[i].userId === order.userId) continue;

      if (executedQty < order.quantity && order.price <= this.bids[i].price) {
        const quantityTaken = Math.min(
          order.quantity - executedQty,
          this.bids[i].quantity - this.bids[i].filled
        );
        executedQty += quantityTaken;
        this.bids[i].filled += quantityTaken;

        fills.push({
          price: String(this.bids[i].price),
          qty: quantityTaken,
          tradeId: this.lastTradeId++,
          otherUserId: this.bids[i].userId,
          markerOrderId: this.bids[i].orderId,
        });
      }
    }

    //removing those bids where utilized all the qty that teher was
    for (let i = 0; i < this.bids.length; i++) {
      if (this.bids[i].filled === this.bids[i].quantity) {
        this.bids.splice(i, 1);
        i--;
      }
    }

    return {
      fills,
      executedQty,
    };
  }

  getDepth() {
    const bidsDep: Record<string, number> = {};
    const asksDep: { [key: string]: number } = {};

    //need to return these 2 sized array for asks and bids, full info not needed
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    //to accumulate same price orders
    for (let i = 0; i < this.bids.length; i++) {
      if (!bidsDep[this.bids[i].price]) {
        bidsDep[this.bids[i].price] = 0;
      }
      bidsDep[this.bids[i].price] +=
        this.bids[i].quantity - this.bids[i].filled; //need to subtract the filled, as only show the quantity on FE which is still available
    }

    //to accumulate same price orders
    for (let i = 0; i < this.asks.length; i++) {
      if (!asksDep[this.asks[i].price]) {
        asksDep[this.asks[i].price] = 0;
      }
      asksDep[this.asks[i].price] +=
        this.asks[i].quantity - this.asks[i].filled; //need to subtract the filled, as only show the quantity on FE which is still available
    }

    for (const price in bidsDep) {
      bids.push([price, bidsDep[price].toString()]);
    }
    for (const price in asksDep) {
      asks.push([price, asksDep[price].toString()]);
    }

    return { bids, asks };
  }

  //get open active orders for the user asked for
  getOpenOrders(userId: string) {
    const bids = this.bids.filter((xx) => xx.userId === userId);
    const asks = this.asks.filter((xx) => xx.userId === userId);
    return [...bids, ...asks];
  }

  //cancel an open bid using orderId
  cancelBid(order: Order) {
    const idx = this.bids.findIndex((xx) => xx.orderId === order.orderId);
    if (idx !== -1) {
      const price = this.bids[idx].price;
      this.bids.splice(idx, 1);
      return price;
    }
  }

  //cancel an open ask using orderId
  cancelAsk(order: Order) {
    const idx = this.asks.findIndex((xx) => xx.orderId === order.orderId);
    if (idx !== -1) {
      const price = this.asks[idx].price;
      this.asks.splice(idx, 1);
      return price;
    }
  }
}
