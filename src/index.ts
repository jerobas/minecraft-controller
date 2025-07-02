import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import multer from "multer";

const app = express();
const port = process.env.PORT || 3001;

const serverDir = path.resolve("./minecraft_server");
const pluginsDir = path.join(serverDir, "plugins");
const eulaFile = path.join(serverDir, "eula.txt");
const serverPropertiesFile = path.join(serverDir, "server.properties");
const logFile = path.join(serverDir, "logs/latest.log");

if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });

app.use(express.json());
app.use(express.static("frontend"));
const upload = multer({ dest: "uploads/" });

app.post("/accept-eula", (_, res) => {
  fs.writeFileSync(eulaFile, "eula=true\n");
  res.json({ success: true });
});

app.post("/upload-plugin", upload.array("pluginJar"), (req, res) => {
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir);

  (req.files as Express.Multer.File[]).forEach((file: Express.Multer.File) => {
    const targetPath = path.join(pluginsDir, file.originalname);
    fs.renameSync(file.path, targetPath);
  });

  res.json({ success: true });
});

app.get("/server-properties", (req, res) => {
  if (!fs.existsSync(serverPropertiesFile)) {
    res.status(404).json({ error: "server.properties not found" });
  }
  const content = fs.readFileSync(serverPropertiesFile, "utf-8");
  res.json({ content });
});

app.post("/server-properties", (req, res) => {
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

app.get("/logs", (_, res) => {
  if (!fs.existsSync(logFile)) res.status(404).json({ error: "Log not found" });
  const content = fs.readFileSync(logFile, "utf-8");
  res.type("text/plain").send(content);
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

app.post("/download-paper", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Minecraft Panel running at http://localhost:${port}`);
});
