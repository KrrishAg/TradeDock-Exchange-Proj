import { isUndefined } from "util";
import { Depth, Ticker, Trade } from "./types";

// export const BASE_URL = "wss://stream.binance.com:9443/ws";
export const BASE_URL = process.env.NEXT_PUBLIC_WEBSOC_URL || "ws://localhost:3001";

//creating a singleton, as dont want to create numtiple websocket connections
export class WSClient {
  private ws: WebSocket;
  private static instance: WSClient;
  private bufferedMessages: any[] = [];
  private callbacks: { [type: string]: any[] } = {};
  private id: number;
  private initialized: boolean = false;

  private constructor() {
    this.ws = new WebSocket(BASE_URL);
    this.bufferedMessages = [];
    this.id = 1;
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WSClient();
    }
    return this.instance;
  }

  init() {
    this.ws.onopen = () => {
      this.initialized = true;
      this.bufferedMessages.forEach((message) => {
        this.ws.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];
    };
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const type = message.e;
      // console.log(type);
      if (this.callbacks[type]) {
        // console.log("IN there");
        if (type === "24hrTicker") {
          // console.log("YO", message);
          this.callbacks[type].forEach((xx) => {
            const newTicker: Partial<Ticker> = {
              lastPrice: message.lastPrice,
            };

            xx.callback(newTicker);
          });
        } else if (type === "depthUpdate") {
          // console.log("New Depth", message);
          this.callbacks[type].forEach((xx) => {
            const newDepth: Depth = {
              bids: message.b,
              asks: message.a,
              lastUpdateId: message.lastUpdateId,
            };

            xx.callback(newDepth);
          });
        } else if (type === "trade") {
          // console.log(message);
          this.callbacks[type].forEach((xx) => {
            const newTrade: Trade = {
              id: message.tradeId,
              isBuyerMaker: message.isBuyerMaker,
              price: message.price,
              volume: message.qty,
              time: message.time,
            };
            // console.log(newTrade);

            xx.callback(newTrade);
          });
        }
      }
    };
  }

  sendMessage(message: any) {
    const newMessage = {
      ...message,
      id: this.id++,
    };
    if (!this.initialized) {
      this.bufferedMessages.push(newMessage);
      return;
    }
    this.ws.send(JSON.stringify(newMessage));
  }

  //registering the callbacks as only have one ws connection, so would perform tasks based on this even "type"
  registerCallBack(type: string, callback: any, id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({
      callback,
      id,
    });
  }

  //deregistering, will be used in the cleanup of useEffect
  deRegisterCallBack(type: string, id: string) {
    const idx =
      this.callbacks[type] &&
      this.callbacks[type].findIndex((xx) => xx.id === id);
    if (idx !== -1 && !isUndefined(idx)) {
      this.callbacks[type].splice(idx, 1);
    }
  }
}
