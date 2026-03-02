const fs = require("fs");
const path = require("path");

const ESM_DIR = path.join(__dirname, "..", "dist", "esm");

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (entry.isFile() && p.endsWith(".js")) fixFile(p);
    }
}

function fixFile(filePath) {
    let code = fs.readFileSync(filePath, "utf8");

    // Add .js to relative import/export specifiers missing an extension:
    // - import x from "./foo"
    // - export * from "./foo"
    // - export { x } from "./foo"
    code = code.replace(/(from\s+['"])(\.{1,2}\/[^'"]+?)(['"])/g, (m, p1, spec, p3) => {
        if (/\.[a-z0-9]+$/i.test(spec) || spec.endsWith("/")) return m;
        return `${p1}${spec}.js${p3}`;
    });

    // Add .js to bare side-effect imports: import "./foo"
    code = code.replace(/(import\s+['"])(\.{1,2}\/[^'"]+?)(['"]\s*;?)/g, (m, p1, spec, p3) => {
        if (/\.[a-z0-9]+$/i.test(spec) || spec.endsWith("/")) return m;
        return `${p1}${spec}.js${p3}`;
    });

    fs.writeFileSync(filePath, code);
}

if (fs.existsSync(ESM_DIR)) walk(ESM_DIR);
