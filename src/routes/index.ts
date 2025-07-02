import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import multer from "multer";
import { Init } from "../utils";

const execAsync = promisify(exec);
const router = Router();

const { serverDir, pluginsDir, serverPropertiesFile } = Init();
const logFile = path.join(serverDir, "logs/latest.log");
const isLinux = process.platform === "linux";

const upload = multer({ dest: "uploads/" });

router.post("/upload-plugin", upload.array("pluginJar"), async (req, res) => {
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
});

router.get("/plugins", (_, res) => {
  try {
    if (!fs.existsSync(pluginsDir)) {
      res.json({ plugins: [] });
      return;
    }
    const plugins = fs
      .readdirSync(pluginsDir)
      .filter((file) => file.endsWith(".jar"));
    res.json({ plugins });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to list plugins." });
  }
});

router.delete("/plugins/:pluginName", (req, res) => {
  try {
    const pluginName = req.params.pluginName;
    const pluginPath = path.join(pluginsDir, pluginName);
    if (!fs.existsSync(pluginPath)) {
      res.status(404).json({ error: "Plugin not found." });
      return;
    }
    fs.unlinkSync(pluginPath);
    res.json({ success: true, message: `Plugin ${pluginName} deleted.` });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || "Failed to delete plugin." });
  }
});

router.get("/server-properties", (_, res) => {
  if (!fs.existsSync(serverPropertiesFile)) {
    res.status(404).json({ error: "server.properties not found" });
    return;
  }
  const content = fs.readFileSync(serverPropertiesFile, "utf-8");
  res.json({ content });
});

router.post("/server-properties", (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Invalid content." });
    return;
  }
  fs.writeFileSync(serverPropertiesFile, content);
  res.json({ success: true });
});

router.post("/start", async (_, res) => {
  try {
    const startCmd = isLinux
      ? `screen -dmS minecraft java -Xmx4G -jar paper.jar nogui`
      : `start "minecraft" cmd /c "java -Xmx4G -jar paper.jar nogui"`;
    await execAsync(startCmd, { cwd: serverDir });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to start server." });
  }
});

router.post("/stop", async (_, res) => {
  try {
    const stopCmd = isLinux
      ? `screen -S minecraft -X stuff "stop\\n"`
      : `taskkill /IM java.exe /F`;
    await execAsync(stopCmd);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to stop server." });
  }
});

router.get("/logs", (_, res) => {
  if (!fs.existsSync(logFile)) {
    res.status(404).json({ error: "Log not found" });
    return;
  }
  const content = fs.readFileSync(logFile, "utf-8");
  res.type("text/plain").send(content);
});

router.get("/paper-versions", async (_, res) => {
  try {
    const response = await fetch("https://api.papermc.io/v2/projects/paper");
    const data = await response.json();
    res.json({ versions: data.versions });
  } catch {
    res.status(500).json({ error: "Failed to fetch Paper versions." });
  }
});

router.post("/download-paper", async (req, res) => {
  const { version } = req.body;
  if (!version || typeof version !== "string") {
    res.status(400).json({ error: "Invalid version." });
    return;
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

router.post("/delete-world", (_, res) => {
  try {
    if (fs.existsSync(serverDir)) {
      fs.rmSync(serverDir, { recursive: true, force: true });
    }
    
    Init();

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

router.post("/send-command", (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") {
    res.status(400).json({ error: "Invalid command." });
    return;
  }
  const sendCmd = `screen -S minecraft -X stuff "${command}\\n"`;
  exec(sendCmd, (error, _, stderr) => {
    if (error) {
      res.status(500).json({ error: stderr || "Failed to send command." });
      return;
    }
    res.json({ success: true, message: `Command "${command}" sent.` });
  });
});

export default router;
