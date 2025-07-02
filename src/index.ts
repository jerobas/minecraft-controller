import express from "express";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import Routes from "./routes";
import { MCStatus } from "./lib";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static("frontend"));

app.use("", Routes);

MCStatus(io);

server.listen(port, () => {
  console.log(
    `Minecraft Panel with Socket.IO running at http://localhost:${port}`
  );
});
