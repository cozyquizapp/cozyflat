import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  throw new Error("Usage: node scripts/repair-growth-alpha.mjs <input> <output>");
}

const image = sharp(input).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

for (let index = 0; index < data.length; index += 4) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  const chroma = brightest - darkest;

  // The generated sheets contain a baked neutral checkerboard. Remove only
  // bright, nearly colourless pixels and softly feather the remaining edge.
  if (brightest >= 210 && chroma <= 20) {
    data[index + 3] = brightest >= 232
      ? 0
      : Math.max(0, Math.min(255, Math.round((232 - brightest) * 12)));
  }
}

await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(output);
