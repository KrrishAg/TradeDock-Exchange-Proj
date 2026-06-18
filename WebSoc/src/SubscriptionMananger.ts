import { createClient, RedisClientType } from "redis";
import { UserManager } from "./UserManager";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private redisClient: RedisClientType; //this redis is mp when engine after processing give the update to ws thru this redis itself i believe
  private userToSubscriptions: Map<string, string[]> = new Map(); //which all subs is a user connected to
  private subscriptionToUsers: Map<string, string[]> = new Map(); //who all users are connected to this sub

  private constructor() {
    this.redisClient = createClient();
    this.redisClient.on("error", (e) => console.error("  Redis error ->", e));
    this.redisClient
      .connect()
      .then(() => console.log("  Connected to Redis (pub/sub)"))
      .catch((e) => console.error("  Redis connection failed ->", e));
  }

  public static getInstance() {
    if (!this.instance) this.instance = new SubscriptionManager();
    return this.instance;
  }

  public subscribe(userId: string, sub: string) {
    if (this.userToSubscriptions.get(userId)?.includes(sub)) return;

    console.log(`  User ${userId} subscribed to ${sub}`);
    //adding sub to the user
    if (!this.userToSubscriptions.has(userId)) {
      this.userToSubscriptions.set(userId, [sub]);
    } else {
      this.userToSubscriptions.get(userId)?.push(sub);
    }

    //adding user to the sub
    if (!this.subscriptionToUsers.has(sub)) {
      this.subscriptionToUsers.set(sub, [userId]);
    } else {
      this.subscriptionToUsers.get(sub)?.push(userId);
    }

    //if a sub has been connected for the first time, need to CONNECT TO REDIS so that for any upcomibng msgs coming to this channel, we receive them
    if (this.subscriptionToUsers.get(sub)?.length === 1) {
      console.log(`  Opening Redis channel: ${sub}`);
      this.redisClient.subscribe(sub, (message: string, channel: string) => {
        this.redisCallbackHandler(message, channel);
      });
    }
    //here redisCallbackHandler wil pass the channel namei.e.message that is receivced as 1st argument and then sub/channel as 2nd, becoz thats how redis guys have written it
  }

  //and in this fn, ALL THE USERS who are connected to that chnanel will be receiving the updates from the emit method described in User
  public redisCallbackHandler(message: string, channel: string) {
    const parsedMessage = JSON.parse(message);
    this.subscriptionToUsers
      .get(channel)
      ?.forEach((user) =>
        UserManager.getInstance().getUser(user)?.emit(parsedMessage.data),
      );
  }

  public unsubscribe(userId: string, sub: string) {
    console.log(`  User ${userId} unsubscribed from ${sub}`);
    //removing from userToSubscriptions
    const subscriptions = this.userToSubscriptions.get(userId);
    if (subscriptions) {
      this.userToSubscriptions.set(
        userId,
        subscriptions?.filter((s) => s !== sub),
      );
      if (this.userToSubscriptions.get(userId)?.length === 0)
        this.userToSubscriptions.delete(userId);
    }

    //removing from subscriptionToUsers
    const reverseSubscriptions = this.subscriptionToUsers.get(sub);
    if (reverseSubscriptions) {
      this.subscriptionToUsers.set(
        sub,
        reverseSubscriptions?.filter((u) => u !== userId),
      );
      if (this.subscriptionToUsers.get(sub)?.length === 0) {
        this.subscriptionToUsers.delete(sub);
        console.log(`  Closing Redis channel (no subscribers left): ${sub}`);
        this.redisClient.unsubscribe(sub); //the extra step here is that if now no user is connected to this sub/channel, then npo point in getting updates, so unsubcscribe
      }
    }
  }

  public userLeft(userId: string) {
    this.userToSubscriptions
      .get(userId)
      ?.forEach((sub) => this.unsubscribe(userId, sub));
  }
}
