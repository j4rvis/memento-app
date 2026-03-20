import { readFileSync, writeFileSync } from "fs";

const swPath = new URL("../public/sw.js", import.meta.url).pathname;
const content = readFileSync(swPath, "utf8");
const timestamp = new Date().toISOString();
const updated = content.replace(
  /const CACHE_VERSION = "[^"]*";/,
  `const CACHE_VERSION = "${timestamp}";`
);
writeFileSync(swPath, updated);
console.log(`SW cache version bumped to ${timestamp}`);
