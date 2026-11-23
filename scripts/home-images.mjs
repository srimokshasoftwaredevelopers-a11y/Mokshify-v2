/* MOKSHIFY — card-sized copies of the client screenshots for the home page.
   Same images as assets/sites/<slug>-plate.webp (1600×1000, captured from the live sites),
   only resized: nothing is retouched.
     <slug>-card.webp    960×600   hero showcase on desktop (shown ~480px wide, 2×)
     <slug>-card-s.webp  640×400   showreel cards and the phone showcase
   node scripts/home-images.mjs   (npm run images:home) */
import sharp from "sharp";
import { statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(fileURLToPath(new URL(".", import.meta.url)), "..", "assets", "sites");
const SLUGS = ["next-edge-realty", "terravion", "medico", "aj-agritech", "fincalix", "qflow", "somallamma", "terravion-in"];
const kb = f => (statSync(join(DIR, f)).size / 1024).toFixed(0);
for (const slug of SLUGS) {
  const src = join(DIR, `${slug}-plate.webp`);
  await sharp(src).resize(960, 600).webp({ quality: 72 }).toFile(join(DIR, `${slug}-card.webp`));
  await sharp(src).resize(640, 400).webp({ quality: 70 }).toFile(join(DIR, `${slug}-card-s.webp`));
  console.log(`${slug}: card ${kb(`${slug}-card.webp`)} KB · card-s ${kb(`${slug}-card-s.webp`)} KB`);
}
