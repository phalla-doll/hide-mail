import { copyFileSync, mkdirSync, existsSync } from "fs";
import { mkdir, copyFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const files = [
  { src: "public/manifest.json", dest: "dist/manifest.json" },
  { src: "public/icons/icon.svg", dest: "dist/icons/icon.svg" }
];

for (const file of files) {
  const srcPath = resolve(root, file.src);
  const destDir = resolve(root, dirname(file.dest));
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(srcPath, resolve(root, file.dest));
}