import WebSocket from "ws";
import { User } from "./User";
import { SubscriptionManager } from "./SubscriptionMananger";

export class UserManager {
  private static instance: UserManager;
  private Users: Map<String, User> = new Map();

  private constructor() {}

  public static getInstance() {
    if (!this.instance) this.instance = new UserManager();
    return this.instance;
  }

  public addUser(ws: WebSocket) {
    const id = this.getRandomId();
    const newUser = new User(id, ws);
    this.Users.set(id, newUser);
    this.registerToDeleteOnCLose(id, ws);
  }

  private registerToDeleteOnCLose(id: string, ws: WebSocket) {
    ws.on("close", () => {
      console.log(`Client ${id} disconnected`);
      this.Users.delete(id);
      SubscriptionManager.getInstance().userLeft(id);
    });
  }

  public getUser(userId: string) {
    return this.Users.get(userId);
  }

  private getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
