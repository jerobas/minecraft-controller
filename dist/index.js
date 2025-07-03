"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const routes_1 = __importDefault(require("./routes"));
const auth_1 = __importDefault(require("./routes/auth"));
const auth_2 = require("./middlewares/auth");
const lib_1 = require("./lib");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: "*" } });
const port = process.env.PORT || 3001;
app.use(express_1.default.json());
app.use(express_1.default.static("frontend", { extensions: ["html"] }));
app.use("/auth", auth_1.default);
app.use("/protected", auth_2.authenticate, routes_1.default);
(0, lib_1.MCStatus)(io);
server.listen(port, () => {
    console.log(`Minecraft Panel with Socket.IO running at http://localhost:${port}`);
});
