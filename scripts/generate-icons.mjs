// scripts/generate-icons.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_SVG = path.join(ROOT, "gentube.svg");
const OUT_DIR = path.join(ROOT, "icons");

// Chrome commonly uses 16, 32, 48, 128. We’ll also emit 256 & 512 for future use.
const SIZES = [16, 32, 48, 128, 256, 512];

async function main() {
  if (!fs.existsSync(SRC_SVG)) {
    console.error(`❌ Missing ${SRC_SVG}. Put your gentube.svg at project root.`);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const svgBuf = fs.readFileSync(SRC_SVG);
  for (const size of SIZES) {
    const outPath = path.join(OUT_DIR, `gentube-${size}.png`);
    // density multiplies the rasterization quality so small sizes stay crisp
    await sharp(svgBuf, { density: size * 4 })
      .resize(size, size, { fit: "contain" }) // keep aspect; add padding if needed
      .png()
      .toFile(outPath);
    console.log(`✅ ${outPath}`);
  }

  console.log("🎉 Done. Update manifest.json to reference icons from /icons.");
}

main().catch((e) => {
  console.error("Icon generation failed:", e);
  process.exit(1);
});
