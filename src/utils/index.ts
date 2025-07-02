import fs from "fs";
import path from "path";

export const Init = () => {
  const serverDir = path.resolve("./minecraft_server");
  const pluginsDir = path.join(serverDir, "plugins");
  const eulaFile = path.join(serverDir, "eula.txt");
  const serverPropertiesFile = path.join(serverDir, "server.properties");
  const templateFile = path.resolve("src/template/server.properties");

  if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true });
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });
  if (!fs.existsSync(eulaFile)) fs.writeFileSync(eulaFile, "eula=true\n");
  if (!fs.existsSync(serverPropertiesFile))
    fs.copyFileSync(templateFile, serverPropertiesFile);

  return { serverDir, pluginsDir, serverPropertiesFile };
};
