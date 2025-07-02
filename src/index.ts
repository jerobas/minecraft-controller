import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import readline from "readline";
import multer from "multer";
import LokiLogger from "logger";

const app = express();
const port = process.env.PORT || 3001;

const serverDir = path.resolve("./minecraft_server");
const pluginsDir = path.join(serverDir, "plugins");
const eulaFile = path.join(serverDir, "eula.txt");
const serverPropertiesFile = path.join(serverDir, "server.properties");
const logFile = path.join(serverDir, "logs/latest.log");
const logger = new LokiLogger({
  jobName: "dev",
  lokiHost: "http://localhost:3100",
}).getLogger();

if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

app.use(express.json());
app.use(express.static("frontend"));
const upload = multer({ dest: "uploads/" });

const restartServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stopCmd = `screen -S minecraft -X stuff "stop\\n"`;
    exec(stopCmd, (stopError, _, stopStderr) => {
      if (stopError) return reject(`Failed to stop: ${stopStderr}`);
      const startCmd = `screen -dmS minecraft java -Xmx4G -jar paper.jar nogui`;
      exec(startCmd, { cwd: serverDir }, (startError, _, startStderr) => {
        if (startError) return reject(`Failed to start: ${startStderr}`);
        resolve();
      });
    });
  });
};

const watchLogs = () => {
  if (!fs.existsSync(logFile)) {
    console.log("Log file not found, waiting for creation...");
    fs.watch(path.dirname(logFile), (eventType, filename) => {
      if (filename === "latest.log" && fs.existsSync(logFile)) {
        console.log("Log file created, starting log tail...");
        startLogTail();
      }
    });
    return;
  }
  startLogTail();
};

const startLogTail = () => {
  const stream = fs.createReadStream(logFile, {
    encoding: "utf-8",
    flags: "r",
  });
  const rl = readline.createInterface({ input: stream });

  rl.on("line", (line) => {
    logger.info(`[MC LOG] ${line}`);
  });

  fs.watchFile(logFile, { interval: 1000 }, () => {
    rl.close();
    startLogTail();
  });
};

watchLogs();

app.post("/accept-eula", async (_, res) => {
  fs.writeFileSync(eulaFile, "eula=true\n");
  await restartServer();
  res.json({ success: true });
});

app.post(
  "/upload-plugin",
  upload.array("pluginJar"),
  async (req: Request, res: Response) => {
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

    (req.files as Express.Multer.File[]).forEach(
      (file: Express.Multer.File) => {
        const targetPath = path.join(pluginsDir, file.originalname);
        fs.renameSync(file.path, targetPath);
      }
    );
    await restartServer();
    res.json({ success: true });
  }
);

app.get("/server-properties", (req: Request, res: Response) => {
  if (!fs.existsSync(serverPropertiesFile)) {
    res.status(404).json({ error: "server.properties not found" });
  }
  const content = fs.readFileSync(serverPropertiesFile, "utf-8");
  res.json({ content });
});

app.post("/server-properties", (req: Request, res: Response) => {
  const { content } = req.body;
  fs.writeFileSync(serverPropertiesFile, content);
  res.json({ success: true });
});

app.post("/start", (_, res) => {
  const startCmd = `screen -dmS minecraft java -Xmx4G -jar paper.jar nogui`;
  console.log(startCmd);
  exec(startCmd, { cwd: serverDir }, (error, _, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    res.json({ success: true });
  });
});

app.post("/stop", (_, res) => {
  const stopCmd = `screen -S minecraft -X stuff \"stop\\n\"`;
  exec(stopCmd, (error, _, stderr) => {
    if (error) return res.status(500).json({ error: stderr });
    res.json({ success: true });
  });
});

app.get("/paper-versions", async (_, res) => {
  try {
    const response = await fetch("https://api.papermc.io/v2/projects/paper");
    const data = (await response.json()) as any;
    res.json({ versions: data.versions });
  } catch {
    res.status(500).json({ error: "Failed to fetch Paper versions." });
  }
});

app.post("/download-paper", async (req: Request, res: Response) => {
  const { version } = req.body;
  try {
    const buildsRes = await fetch(
      `https://api.papermc.io/v2/projects/paper/versions/${version}`
    );
    const buildsData = (await buildsRes.json()) as any;
    const latestBuild = buildsData.builds[buildsData.builds.length - 1];
    const fileName = `paper-${version}-${latestBuild}.jar`;

    const downloadRes = await fetch(
      `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild}/downloads/${fileName}`
    );
    const arrayBuffer = await downloadRes.arrayBuffer();
    fs.writeFileSync(
      path.join(serverDir, "paper.jar"),
      Buffer.from(arrayBuffer)
    );

    res.json({
      success: true,
      message: `Paper ${version} downloaded successfully.`,
    });
  } catch {
    res.status(500).json({ error: "Failed to download Paper jar." });
  }
});

app.post("/send-command", (req: Request, res: Response) => {
  const { command } = req.body;

  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "Invalid command." });
  }

  const sendCmd = `screen -S minecraft -X stuff "${command}\\n"`;
  exec(sendCmd, (error, _, stderr) => {
    if (error) {
      return res
        .status(500)
        .json({ error: stderr || "Failed to send command." });
    }
    res.json({ success: true, message: `Command "${command}" sent.` });
  });
});

app.listen(port, () => {
  console.log(`Minecraft Panel running at http://localhost:${port}`);
});
