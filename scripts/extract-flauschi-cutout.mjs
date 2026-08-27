import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error("Usage: node scripts/extract-flauschi-cutout.mjs INPUT OUTPUT");
}

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = width * height;
const background = new Uint8Array(pixels);
const queue = new Int32Array(pixels);
let head = 0;
let tail = 0;

function looksLikeCheckerboard(index) {
  const offset = index * channels;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return spread <= 16 && (r + g + b) / 3 >= 205;
}

function enqueue(index) {
  if (background[index] || !looksLikeCheckerboard(index)) return;
  background[index] = 1;
  queue[tail++] = index;
}

for (let x = 0; x < width; x += 1) {
  enqueue(x);
  enqueue((height - 1) * width + x);
}
for (let y = 0; y < height; y += 1) {
  enqueue(y * width);
  enqueue(y * width + width - 1);
}

while (head < tail) {
  const index = queue[head++];
  const x = index % width;
  const y = Math.floor(index / width);
  if (x > 0) enqueue(index - 1);
  if (x + 1 < width) enqueue(index + 1);
  if (y > 0) enqueue(index - width);
  if (y + 1 < height) enqueue(index + width);
}

for (let index = 0; index < pixels; index += 1) {
  const offset = index * channels;
  if (background[index]) {
    data[offset + 3] = 0;
    continue;
  }

  const x = index % width;
  const y = Math.floor(index / width);
  let touchesBackground = false;
  for (let dy = -1; dy <= 1 && !touchesBackground; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && background[ny * width + nx]) {
        touchesBackground = true;
        break;
      }
    }
  }

  if (touchesBackground) {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    const edgeAlpha = Math.max(0, Math.min(255, Math.round((spread - 8) * 11)));
    data[offset + 3] = Math.min(data[offset + 3], edgeAlpha);
  }
}

await sharp(data, { raw: info })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({ top: 32, bottom: 32, left: 32, right: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 92, alphaQuality: 100, smartSubsample: true })
  .toFile(output);

console.log(output);
