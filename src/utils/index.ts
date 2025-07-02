import fs from "fs";
import path from "path";

export const Init = () => {
  const serverDir = path.resolve("./minecraft_server");
  const pluginsDir = path.join(serverDir, "plugins");
  const eulaFile = path.join(serverDir, "eula.txt");
  const templateFile = path.resolve("src/template/server.properties");
  const templateImage = path.resolve("src/template/server-icon.png");
  const serverTemplateImage = path.join(serverDir, "server-icon.png");
  const serverPropertiesFile = path.join(serverDir, "server.properties");

  if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
  if (!fs.existsSync(eulaFile)) fs.writeFileSync(eulaFile, "eula=true\n");
  if (!fs.existsSync(serverPropertiesFile))
    fs.copyFileSync(templateFile, serverPropertiesFile);
  if (!fs.existsSync(serverTemplateImage))
    fs.copyFileSync(templateImage, serverTemplateImage);

  return { serverDir, pluginsDir, serverPropertiesFile };
};
