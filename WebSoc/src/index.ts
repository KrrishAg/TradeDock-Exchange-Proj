import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3005 });

wss.on("connection", (ws) => {
  console.log("Connecting to WS: ", ws);
  UserManager.getInstance().addUser(ws);
});
