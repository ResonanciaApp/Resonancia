import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputDir = "attached_assets/processed/profile-avatar-catalog";
const sheets = [
  "attached_assets/image_1791323663792.png",
  "attached_assets/image_(1)_1791323663793.png",
];
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
  if (components.length !== 30) throw new Error(`Expected 30 circles in sheet ${sheetIndex + 1}, found ${components.length}`);
  for (let row = 0; row < 5; row++) {
    const cells = components.slice(row * 6, (row + 1) * 6).sort((a, b) => a.x - b.x);
    if (Math.max(...cells.map(c => c.centerY)) - Math.min(...cells.map(c => c.centerY)) > 40) {
      throw new Error(`Invalid row grouping in sheet ${sheetIndex + 1}`);
    }
    for (const [column, cell] of cells.entries()) {
      // An inscribed square/circle trims only the uneven outer rim; scaling stays uniform.
      const side = Math.min(cell.width, cell.height) - 4;
      const x = cell.x + Math.floor((cell.width - side) / 2);
      const y = cell.y + Math.floor((cell.height - side) / 2);
      const number = images.length + 1;
      const filePath = `${outputDir}/avatar-${String(number).padStart(2, "0")}.png`;
      magick(sheet, "-crop", `${side}x${side}+${x}+${y}`, "+repage",
        "-resize", "512x512", mask, "-compose", "CopyOpacity", "-composite",
        "-compose", "Over", `PNG32:${filePath}`);
      images.push({ number, filePath, sheet: sheetIndex + 1, row: row + 1, column: column + 1,
        crop: { x, y, side }, width: 512, height: 512 });
    }
  }
}
writeFileSync(`${outputDir}/manifest.json`, JSON.stringify({ images }, null, 2));
console.log(`Prepared ${images.length} circular avatars, all 512×512.`);
