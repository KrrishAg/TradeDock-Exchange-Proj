import { createClient, RedisClientType } from "redis";
import { MessageToEngine } from "./types/toEngine";
import { MessageFromOrderbook } from "./types";

export class RedisManager {
  private publisher: RedisClientType;
  private queue: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.publisher = createClient();
    this.queue = createClient();
    this.publisher.on("error", (e) =>
      console.error(" Redis (publisher) error ->", e),
    );
    this.queue.on("error", (e) => console.error(" Redis (queue) error ->", e));
    Promise.all([this.publisher.connect(), this.queue.connect()])
      .then(() => console.log(" Connected to Redis"))
      .catch((e) => console.error(" Redis connection failed ->", e));
  }

  public static getInstance() {
    if (!this.instance) this.instance = new RedisManager();
    return this.instance;
  }

  public sendAndAwait(message: MessageToEngine) {
    const id = this.generateRandomID();
    return new Promise<MessageFromOrderbook>((resolve) => {
      this.publisher.subscribe(id, (message: any) => {
        this.publisher.unsubscribe(id);
        resolve(JSON.parse(message));
      });
      this.queue.lPush("messages", JSON.stringify({ clientId: id, message }));
    });
  }

  public generateRandomID() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
