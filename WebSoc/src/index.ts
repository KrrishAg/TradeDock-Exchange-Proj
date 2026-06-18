import { WebSocketServer } from "ws";
import { UserManager } from "./UserManager";

const wss = new WebSocketServer({ port: 3005 });
console.log("WebSocket server listening");

wss.on("connection", (ws) => {
  console.log("New client connected");
  UserManager.getInstance().addUser(ws);
});
