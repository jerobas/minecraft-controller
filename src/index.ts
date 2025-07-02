import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import multer from "multer";
import { promisify } from "util";

const execAsync = promisify(exec);
const app = express();
const port = process.env.PORT || 3001;

const serverDir = path.resolve("./minecraft_server");
const pluginsDir = path.join(serverDir, "plugins");
const eulaFile = path.join(serverDir, "eula.txt");
const serverPropertiesFile = path.join(serverDir, "server.properties");
const logFile = path.join(serverDir, "logs/latest.log");

if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

app.use(express.json());
app.use(express.static("frontend"));
const upload = multer({ dest: "uploads/" });

app.post("/accept-eula", async (_, res) => {
  try {
    fs.writeFileSync(eulaFile, "eula=true\n");
    const startCmd = `screen -dmS minecraft java -Xmx4G -jar paper.jar nogui`;
    await execAsync(startCmd, { cwd: serverDir });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to start server." });
  }
});

app.post(
  "/upload-plugin",
  upload.array("pluginJar"),
  async (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(pluginsDir))
        fs.mkdirSync(pluginsDir, { recursive: true });
      (req.files as Express.Multer.File[]).forEach((file) => {
        const targetPath = path.join(pluginsDir, file.originalname);
        fs.renameSync(file.path, targetPath);
      });
      res.json({ success: true });
    } catch (error: any) {
      res
        .status(500)
        .json({ error: error.message || "Failed to upload plugin." });
    }
  }
);

app.get("/server-properties", (_, res) => {
  if (!fs.existsSync(serverPropertiesFile)) {
    res.status(404).json({ error: "server.properties not found" });
  }
  const content = fs.readFileSync(serverPropertiesFile, "utf-8");
  res.json({ content });
});

app.post("/server-properties", (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Invalid content." });
  }
  fs.writeFileSync(serverPropertiesFile, content);
  res.json({ success: true });
});

app.post("/start", async (_, res) => {
  try {
    const startCmd = `screen -dmS minecraft java -Xmx4G -jar paper.jar nogui`;
    await execAsync(startCmd, { cwd: serverDir });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to start server." });
  }
});

app.post("/stop", async (_, res) => {
  try {
    const stopCmd = `screen -S minecraft -X stuff "stop\\n"`;
    await execAsync(stopCmd);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to stop server." });
  }
});

app.get("/logs", (_, res) => {
  if (!fs.existsSync(logFile)) {
    res.status(404).json({ error: "Log not found" });
  }
  const content = fs.readFileSync(logFile, "utf-8");
  res.type("text/plain").send(content);
});

app.get("/paper-versions", async (_, res) => {
  try {
    const response = await fetch("https://api.papermc.io/v2/projects/paper");
    const data = await response.json();
    res.json({ versions: data.versions });
  } catch {
    res.status(500).json({ error: "Failed to fetch Paper versions." });
  }
});

app.post("/download-paper", async (req: Request, res: Response) => {
  const { version } = req.body;
  if (!version || typeof version !== "string") {
    res.status(400).json({ error: "Invalid version." });
  }
  try {
    const buildsRes = await fetch(
      `https://api.papermc.io/v2/projects/paper/versions/${version}`
    );
    const buildsData = await buildsRes.json();
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

app.post("/delete-world", (_, res) => {
  try {
    if (fs.existsSync(serverDir)) {
      fs.rmSync(serverDir, { recursive: true, force: true });
    }
    fs.mkdirSync(serverDir, { recursive: true });
    res.json({
      success: true,
      message: "Server directory deleted and recreated.",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || "Failed to reset server directory." });
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
      res.status(500).json({ error: stderr || "Failed to send command." });
    }
    res.json({ success: true, message: `Command "${command}" sent.` });
  });
});

app.listen(port, () => {
  console.log(`Minecraft Panel running at http://localhost:${port}`);
});
