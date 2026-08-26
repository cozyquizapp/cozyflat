import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const growthDir = "public/garden/growth";
const outputDir = "public/garden/stages";
const plantKeys = ["alocasia", "bonsai", "cactus", "calathea", "fern", "ficus", "ivy", "monstera", "orchid", "palm", "pilea", "snake"];
const targetSizes = [240, 300, 360, 430, 500];
const canvasSize = 512;

await fs.mkdir(outputDir, { recursive: true });

for (const plantKey of plantKeys) {
  const preferred = path.join(growthDir, `growth-${plantKey}${["monstera", "orchid"].includes(plantKey) ? "-v2" : ""}.png`);
  const source = await fs.access(preferred).then(() => preferred).catch(() => path.join(growthDir, `growth-${plantKey}.png`));
  const metadata = await sharp(source).metadata();
  const { data: pixels, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rowInk = Array.from({ length: info.height }, (_, y) => {
    let ink = 0;
    for (let x = 0; x < info.width; x += 1) {
      if (pixels[(y * info.width + x) * 4 + 3] > 32) ink += 1;
    }
    return ink;
  });
  const boundaries = [0];
  for (let boundaryIndex = 1; boundaryIndex < 5; boundaryIndex += 1) {
    const target = Math.round((info.height * boundaryIndex) / 5);
    const radius = Math.round(info.height * 0.14);
    let bestY = target;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let y = Math.max(boundaries.at(-1) + 20, target - radius); y <= Math.min(info.height - 20, target + radius); y += 1) {
      const score = rowInk[y] + Math.abs(y - target) * 0.015;
      if (score < bestScore) {
        bestScore = score;
        bestY = y;
      }
    }
    boundaries.push(bestY);
  }
  boundaries.push(info.height);

  for (let index = 0; index < 5; index += 1) {
    const top = boundaries[index];
    const height = boundaries[index + 1] - top;
    const rawFrame = await sharp(source)
      .extract({ left: 0, top, width: metadata.width, height })
      .png()
      .toBuffer();
    const frame = await sharp(rawFrame)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: targetSizes[index], height: targetSizes[index], fit: "inside", withoutEnlargement: false })
      .png()
      .toBuffer();
    const frameMetadata = await sharp(frame).metadata();
    const left = Math.round((canvasSize - frameMetadata.width) / 2);
    const topOnCanvas = canvasSize - frameMetadata.height;

    await sharp({
      create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: frame, left, top: topOnCanvas }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(outputDir, `${plantKey}-${index + 1}.png`));
  }
}

console.log(`Created ${plantKeys.length * 5} normalized growth stages in ${outputDir}`);
