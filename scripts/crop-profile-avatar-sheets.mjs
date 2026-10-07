import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const option = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const outputDir = option("--output") ?? "attached_assets/processed/profile-avatar-catalog";
const sheetArguments = args.flatMap((arg, index) => arg === "--sheet" ? [args[index + 1]] : []);
const sheets = sheetArguments.length ? sheetArguments : [
  "attached_assets/image_1791323663792.png",
  "attached_assets/image_(1)_1791323663793.png",
];
const columns = Number(option("--columns") ?? 6);
const rows = Number(option("--rows") ?? 5);
if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1 ||
  sheets.some(sheet => !sheet || sheet.startsWith("--"))) throw new Error("Invalid sheet grid arguments.");
const losslessWebp = args.includes("--lossless-webp");
const rowCentered = args.includes("--row-centered");
const temporary = losslessWebp ? mkdtempSync(join(tmpdir(), "profile-avatar-crops-")) : null;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
};
mkdirSync(outputDir, { recursive: true });
const mask = resolve(outputDir, "circle-mask.png");
const magick = (...args) => execFileSync("magick", args, { encoding: "utf8", maxBuffer: 1024 * 1024 });
magick("-size", "512x512", "xc:white", "-fx",
  "max(0,min(1,256-sqrt(pow(i-255.5,2)+pow(j-255.5,2))))", mask);
const images = [];

for (const [sheetIndex, sheet] of sheets.entries()) {
  const report = magick(sheet, "-alpha", "off", "-colorspace", "gray", "-threshold", "2%",
    "-define", "connected-components:verbose=true",
    "-define", "connected-components:area-threshold=10000", "-connected-components", "8", "null:");
  const components = [...report.matchAll(/^\s*\d+:\s+(\d+)x(\d+)\+(\d+)\+(\d+)\s+.*gray\(255\)/gm)]
    .map((match) => {
      const [width, height, x, y] = match.slice(1).map(Number);
      return { width, height, x, y, centerY: y + height / 2 };
    }).sort((a, b) => a.centerY - b.centerY);
  if (components.length !== rows * columns) throw new Error(`Expected ${rows * columns} circles in sheet ${sheetIndex + 1}, found ${components.length}`);
  for (let row = 0; row < rows; row++) {
    const cells = components.slice(row * columns, (row + 1) * columns).sort((a, b) => a.x - b.x);
    if (Math.max(...cells.map(c => c.centerY)) - Math.min(...cells.map(c => c.centerY)) > 40) {
      throw new Error(`Invalid row grouping in sheet ${sheetIndex + 1}`);
    }
    // Ignore connected decorations protruding above/below the circular backgrounds.
    const rowDiameter = Math.round(median(cells.map(cell => cell.height)));
    const rowCenterY = median(cells.map(cell => cell.centerY));
    for (const [column, cell] of cells.entries()) {
      // An inscribed square/circle trims only the uneven outer rim; scaling stays uniform.
      const side = (rowCentered ? Math.min(rowDiameter, cell.width) : Math.min(cell.width, cell.height)) - 4;
      const x = cell.x + Math.floor((cell.width - side) / 2);
      const y = rowCentered ? Math.floor(rowCenterY - side / 2) : cell.y + Math.floor((cell.height - side) / 2);
      const number = images.length + 1;
      const filename = `avatar-${String(number).padStart(2, "0")}`;
      const pngPath = losslessWebp ? join(temporary, `${filename}.png`) : `${outputDir}/${filename}.png`;
      const filePath = `${outputDir}/${filename}.${losslessWebp ? "webp" : "png"}`;
      magick(sheet, "-crop", `${side}x${side}+${x}+${y}`, "+repage",
        "-resize", "512x512", mask, "-compose", "CopyOpacity", "-composite",
        "-compose", "Over", `PNG32:${pngPath}`);
      let pixelHash;
      if (losslessWebp) {
        magick(pngPath, "-define", "webp:lossless=true", "-define", "webp:exact=true",
          "-define", "webp:method=6", filePath);
        const decodedHash = path => createHash("sha256").update(execFileSync("magick",
          [path, "-depth", "8", "RGBA:-"], { maxBuffer: 2 * 1024 * 1024 })).digest("hex");
        pixelHash = decodedHash(pngPath);
        if (pixelHash !== decodedHash(filePath)) throw new Error(`Lossless verification failed for avatar ${number}`);
      }
      images.push({ number, filePath, sheet: sheetIndex + 1, row: row + 1, column: column + 1,
        crop: { x, y, side }, width: 512, height: 512,
        ...(losslessWebp ? { pixelHash, sizeBytes: readFileSync(filePath).length, contentType: "image/webp" } : {}) });
    }
  }
}
writeFileSync(`${outputDir}/manifest.json`, JSON.stringify({ images }, null, 2));
if (temporary) rmSync(temporary, { recursive: true, force: true });
console.log(`Prepared ${images.length} circular avatars, all 512×512.`);
