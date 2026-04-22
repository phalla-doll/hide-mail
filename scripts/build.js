import * as esbuild from "esbuild";
import sharp from "sharp";
import { copyFileSync, mkdirSync, existsSync, readFileSync } from "fs";
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

// Generate PNG icons from SVG
const svgPath = resolve(root, "public/icons/icon.svg");
const svgBuffer = readFileSync(svgPath);

const sizes = [16, 48, 128];
for (const size of sizes) {
  const outputPath = resolve(root, `dist/icons/icon${size}.png`);
  await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);
  console.log(`Generated icon${size}.png`);
}

// Copy manifest.json
copyFileSync("public/manifest.json", "dist/manifest.json");

// Copy HTML files
copyFileSync("src/popup/popup.html", "dist/popup/popup.html");
copyFileSync("src/options/options.html", "dist/options/options.html");

console.log("Build complete!");