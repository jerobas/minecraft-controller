"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const multer_1 = __importDefault(require("multer"));
const utils_1 = require("../utils");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const router = (0, express_1.Router)();
const { serverDir, pluginsDir, serverPropertiesFile } = (0, utils_1.Init)();
const logFile = path_1.default.join(serverDir, "logs/latest.log");
const isLinux = process.platform === "linux";
const upload = (0, multer_1.default)({ dest: "uploads/" });
router.post("/upload-plugin", upload.array("pluginJar"), async (req, res) => {
    try {
        if (!fs_1.default.existsSync(pluginsDir))
            fs_1.default.mkdirSync(pluginsDir, { recursive: true });
        req.files.forEach((file) => {
            const targetPath = path_1.default.join(pluginsDir, file.originalname);
            fs_1.default.renameSync(file.path, targetPath);
        });
        res.json({ success: true });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: error.message || "Failed to upload plugin." });
    }
});
router.get("/plugins", (_, res) => {
    try {
        if (!fs_1.default.existsSync(pluginsDir)) {
            res.json({ plugins: [] });
            return;
        }
        const plugins = fs_1.default
            .readdirSync(pluginsDir)
            .filter((file) => file.endsWith(".jar"));
        res.json({ plugins });
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to list plugins." });
    }
});
router.delete("/plugins/:pluginName", (req, res) => {
    try {
        const pluginName = req.params.pluginName;
        const pluginPath = path_1.default.join(pluginsDir, pluginName);
        if (!fs_1.default.existsSync(pluginPath)) {
            res.status(404).json({ error: "Plugin not found." });
            return;
        }
        fs_1.default.unlinkSync(pluginPath);
        res.json({ success: true, message: `Plugin ${pluginName} deleted.` });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: error.message || "Failed to delete plugin." });
    }
});
router.get("/server-properties", (_, res) => {
    if (!fs_1.default.existsSync(serverPropertiesFile)) {
        res.status(404).json({ error: "server.properties not found" });
        return;
    }
    const content = fs_1.default.readFileSync(serverPropertiesFile, "utf-8");
    res.json({ content });
});
router.post("/server-properties", (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== "string") {
        res.status(400).json({ error: "Invalid content." });
        return;
    }
    fs_1.default.writeFileSync(serverPropertiesFile, content);
    res.json({ success: true });
});
router.post("/start", async (_, res) => {
    try {
        const startCmd = isLinux
            ? `screen -dmS minecraft java -Xmx4G -jar paper.jar nogui`
            : `start "minecraft" cmd /c "java -Xmx4G -jar paper.jar nogui"`;
        await execAsync(startCmd, { cwd: serverDir });
        res.json({ success: true });
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to stop server." });
    }
});
router.get("/logs", (_, res) => {
    if (!fs_1.default.existsSync(logFile)) {
        res.status(404).json({ error: "Log not found" });
        return;
    }
    const content = fs_1.default.readFileSync(logFile, "utf-8");
    res.type("text/plain").send(content);
});
router.get("/paper-versions", async (_, res) => {
    try {
        const response = await fetch("https://api.papermc.io/v2/projects/paper");
        const data = await response.json();
        res.json({ versions: data.versions });
    }
    catch {
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
        const buildsRes = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}`);
        const buildsData = await buildsRes.json();
        const latestBuild = buildsData.builds[buildsData.builds.length - 1];
        const fileName = `paper-${version}-${latestBuild}.jar`;
        const downloadRes = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild}/downloads/${fileName}`);
        const arrayBuffer = await downloadRes.arrayBuffer();
        fs_1.default.writeFileSync(path_1.default.join(serverDir, "paper.jar"), Buffer.from(arrayBuffer));
        res.json({
            success: true,
            message: `Paper ${version} downloaded successfully.`,
        });
    }
    catch {
        res.status(500).json({ error: "Failed to download Paper jar." });
    }
});
router.post("/delete-world", (_, res) => {
    try {
        if (fs_1.default.existsSync(serverDir)) {
            fs_1.default.rmSync(serverDir, { recursive: true, force: true });
        }
        (0, utils_1.Init)();
        res.json({
            success: true,
            message: "Server directory deleted and recreated.",
        });
    }
    catch (error) {
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
    (0, child_process_1.exec)(sendCmd, (error, _, stderr) => {
        if (error) {
            res.status(500).json({ error: stderr || "Failed to send command." });
            return;
        }
        res.json({ success: true, message: `Command "${command}" sent.` });
    });
});
exports.default = router;
