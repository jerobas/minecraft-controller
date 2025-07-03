"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Init = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Init = () => {
    const serverDir = path_1.default.resolve("./minecraft_server");
    const pluginsDir = path_1.default.join(serverDir, "plugins");
    const eulaFile = path_1.default.join(serverDir, "eula.txt");
    const templateFile = path_1.default.join(__dirname, "../template/server.properties");
    const templateImage = path_1.default.join(__dirname, "../template/server-icon.png");
    const serverTemplateImage = path_1.default.join(serverDir, "server-icon.png");
    const serverPropertiesFile = path_1.default.join(serverDir, "server.properties");
    if (!fs_1.default.existsSync(serverDir))
        fs_1.default.mkdirSync(serverDir, { recursive: true });
    if (!fs_1.default.existsSync(pluginsDir))
        fs_1.default.mkdirSync(pluginsDir, { recursive: true });
    if (!fs_1.default.existsSync(eulaFile))
        fs_1.default.writeFileSync(eulaFile, "eula=true\n");
    if (!fs_1.default.existsSync(serverPropertiesFile))
        fs_1.default.copyFileSync(templateFile, serverPropertiesFile);
    if (!fs_1.default.existsSync(serverTemplateImage))
        fs_1.default.copyFileSync(templateImage, serverTemplateImage);
    return { serverDir, pluginsDir, serverPropertiesFile };
};
exports.Init = Init;
