import { RedisClientType } from "@redis/client";
import { createClient } from "redis";
import { DbMessage } from "./types/toDb";
import { MessageToApi } from "./types/toApi";
import { WsMessage } from "./types/toWS";
import { sourceMapsEnabled } from "process";

export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  constructor() {
    this.client = createClient();
    this.client.connect();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public pushMessage(message: DbMessage) {
    console.log("DB Message received: ",message);
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
