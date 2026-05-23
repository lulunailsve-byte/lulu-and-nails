// Genera iconos PWA desde el logo. Correr con `node scripts/gen-icons.mjs`.
import sharp from "sharp";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const LOGO = path.resolve("../lulu nails logo.png");
const OUT_DIR = path.resolve("./public/icons");
const FAVICON_OUT = path.resolve("./app/icon.png");
const APPLE_OUT = path.resolve("./app/apple-icon.png");

// Centra el logo dentro de un cuadrado con fondo color marca, dejando padding.
async function makeIcon(size, outFile, { bg = { r: 0xFE, g: 0xFC, b: 0xFA, alpha: 1 }, padFraction = 0.12 } = {}) {
  const padding = Math.floor(size * padFraction);
  const inner = size - padding * 2;
  const logoBuf = await sharp(LOGO)
    .resize({ width: inner, height: inner, fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logoBuf, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  console.log(`✓ ${outFile} (${size}x${size})`);
}

await mkdir(OUT_DIR, { recursive: true });
await makeIcon(192, path.join(OUT_DIR, "icon-192.png"));
await makeIcon(512, path.join(OUT_DIR, "icon-512.png"));
// Apple touch icon — fondo violeta para que se vea bien en springboard
await makeIcon(180, APPLE_OUT, { bg: { r: 0x7B, g: 0x5C, b: 0xFF, alpha: 1 }, padFraction: 0.18 });
// Favicon (32px)
await makeIcon(32, FAVICON_OUT, { padFraction: 0.08 });
console.log("Iconos generados.");
