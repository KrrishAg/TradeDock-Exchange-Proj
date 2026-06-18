import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { DbMessage } from "./types/toDb";
import { MessageToApi } from "./types/toApi";
import { WsMessage } from "./types/toWS";

export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  constructor() {
    this.client = createClient();
    this.client.on("error", (e) =>
      console.error("  Redis (publisher) error ->", e),
    );
    this.client
      .connect()
      .then(() => console.log("Redis publisher connected"))
      .catch((e) => console.error("Redis connection failed ->", e));
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public pushMessage(message: DbMessage) {
    console.log("pushing to DB queue:", message.type);
    this.client.lPush("db_process", JSON.stringify(message));
  }

  //need to publish here, as it is pubsub
  public publishMessage(channel: string, message: WsMessage) {
    this.client.publish(channel, JSON.stringify(message));
  }

  //need to publish here, as it is pubsub
  public sendToApi(clientId: string, message: MessageToApi) {
    this.client.publish(clientId, JSON.stringify(message));
  }
}
