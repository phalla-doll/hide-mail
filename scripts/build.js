import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// Build with esbuild
await esbuild.build({
  entryPoints: [
    "src/content/content-script.ts",
    "src/background/service-worker.ts",
    "src/popup/popup.ts",
    "src/options/options.ts"
  ],
  bundle: true,
  outdir: "dist",
  format: "iife",
  platform: "browser",
  target: "chrome110",
  minify: false,
  sourcemap: false,
  splitting: false,
  loader: { ".ts": "ts" },
  logLevel: "info"
});

// Copy static files
const staticFiles = [
  { src: "public/manifest.json", dest: "dist/manifest.json" },
  { src: "public/icons/icon.svg", dest: "dist/icons/icon.svg" }
];

for (const file of staticFiles) {
  const srcPath = resolve(root, file.src);
  const destDir = resolve(root, dirname(file.dest));
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  copyFileSync(srcPath, resolve(root, file.dest));
}

// Copy HTML files
copyFileSync("src/popup/popup.html", "dist/popup/popup.html");
copyFileSync("src/options/options.html", "dist/options/options.html");

console.log("Build complete!");