const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "dist", "esm");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module" }));
