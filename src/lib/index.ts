import { Server as SocketIOServer } from "socket.io";
import { status } from "minecraft-server-util";
import cron from "node-cron";
import path from "path";
import fs from "fs";

const getServerStatus = async (host = "localhost", port = 25565) => {
  const paperJarExists = fs.existsSync(
    path.join("./minecraft_server", "paper.jar")
  );
  try {
    const result = await status(host, port);
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
  } catch {
    return { online: false, jarFile: paperJarExists };
  }
};

export const MCStatus = (io: SocketIOServer) => {
  cron.schedule("*/5 * * * * *", async () => {
    const status = await getServerStatus();
    io.emit("minecraftStatus", status);
  });
};
