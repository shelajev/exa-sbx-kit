const configure = () => {
  const fs = require("fs");
  const path = require("path");
  const server = { type: "stdio", command: "exa-mcp-server" };
  const configs = [
    [path.join(process.cwd(), ".mcp.json"), "mcpServers"],
    [path.join(process.cwd(), ".vscode", "mcp.json"), "servers"],
    [path.join(process.env.HOME, ".gemini", "settings.json"), "mcpServers"]
  ];
  for (const [file, section] of configs) {
    let config = {};
    if (fs.existsSync(file)) {
      try {
        config = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        console.warn(`Exa kit: skipped invalid JSON in ${file}`);
        continue;
      }
    }
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      console.warn(`Exa kit: skipped non-object JSON in ${file}`);
      continue;
    }
    if (config[section] !== undefined &&
        (!config[section] || typeof config[section] !== "object" || Array.isArray(config[section]))) {
      console.warn(`Exa kit: skipped non-object ${section} in ${file}`);
      continue;
    }
    const cur = config[section] && config[section].exa;
    if (JSON.stringify(cur) === JSON.stringify(server)) { continue; }
    config[section] = { ...(config[section] || {}), exa: server };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
  }
};
if (require.main === module) configure();
module.exports = { configure };
