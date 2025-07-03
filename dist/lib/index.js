"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCStatus = void 0;
const minecraft_server_util_1 = require("minecraft-server-util");
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getServerStatus = async (host = "localhost", port = 25565) => {
    const paperJarExists = fs_1.default.existsSync(path_1.default.join("./minecraft_server", "paper.jar"));
    try {
        const result = await (0, minecraft_server_util_1.status)(host, port);
        return {
            online: true,
            playersOnline: result.players.online,
            maxPlayers: result.players.max,
            motd: result.motd.clean,
            version: result.version.name,
            players: result.players.sample?.map((p) => p.name) || [],
            jarFile: paperJarExists,
            raw: result,
        };
    }
    catch {
        return { online: false, jarFile: paperJarExists };
    }
};
const MCStatus = (io) => {
    node_cron_1.default.schedule("*/5 * * * * *", async () => {
        const status = await getServerStatus();
        io.emit("minecraftStatus", status);
    });
};
exports.MCStatus = MCStatus;
