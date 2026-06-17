import WebSocket from "ws";
import { OutMessage } from "./types/out";
import { InMessage, UNSUBSCRIBE } from "./types/in";
import { SubscriptionManager } from "./SubscriptionMananger";

export class User {
  private id: string;
  private ws: WebSocket;
  private subscriptions: string[] = [];

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListners();
  }

  public subscribe(sub: string) {
    console.log("Subscribing to: ", sub);
    this.subscriptions.push(sub);
  }

  public unsubscribe(sub: string) {
    console.log("Unsubscribing from: ", sub);
    this.subscriptions = this.subscriptions.filter((x) => x !== sub);
  }

  public emit(message: OutMessage) {
    console.log("Emitting message: ", message);
    this.ws.send(JSON.stringify(message));
  }

  public addListners() {
    this.ws.on("message", (message: string) => {
      const msg: InMessage = JSON.parse(message);
      console.log("MSG RECEIVED -> ", msg);
      if (msg.method === "SUBSCRIBE") {
        msg.params.forEach((s) =>
          SubscriptionManager.getInstance().subscribe(this.id, s)
        );
      }

      if (msg.method === "UNSUBSCRIBE") {
        msg.params.forEach((s) =>
          SubscriptionManager.getInstance().unsubscribe(this.id, s)
        );
      }
    });
  }
}
