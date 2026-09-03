// One-off: normalise the raw Wix exports into web-ready assets in public/images.
// Run with `node scripts/optimize-assets.mjs`.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const RAW = '_assets_raw';
const OUT = 'public/images';
mkdirSync(OUT, { recursive: true });

/** @type {{from: string, to: string, width: number, fit?: 'cover'|'inside', quality?: number}[]} */
const jobs = [
  // Hero slideshow — full-bleed, 16:6 crop on desktop
  { from: '7dd077_12d6511fbe9a4606afbef14632f70617.jpeg', to: 'hero-1', width: 2560 },
  { from: '7dd077_c81d667c578d47278bd54fc3c7515603.jpg',  to: 'hero-2', width: 2560 },
  { from: '7dd077_cb15a037d77148afbac35c6822180240.jpg',  to: 'hero-3', width: 2560 },
  { from: '7dd077_66655d481cfa424bbaadb60ebd252eb1.jpg',  to: 'hero-4', width: 2560 },
  { from: '7dd077_ec9d887733354fc3a64cd3f90d864a4f.jpg',  to: 'hero-5', width: 2560 },
  // Section imagery
  { from: '7dd077_7cf98fdfc0c14a5b9e4d6a002a0d43fd.jpg',  to: 'peacock-sign',  width: 1400 },
  { from: '7dd077_18b8a2a217694a17b7aa2e8ce643444f.jpeg', to: 'cafe-menu-hero', width: 2560 },
  { from: '7dd077_442c7f42554e4a529630e3fb0cb0cfb1.jpg',  to: 'shopfront',     width: 1951 },
  { from: '7dd077_806741970eed4e74912c8a1d51e56811.jpg',  to: 'og-cafe-menu',  width: 1600 },
  { from: '7dd077_9b1bafe2efa3400a9ea2917a6b14f56b.jpg',  to: 'og-default',    width: 1366 },
  // Menu boards (kept as images alongside the new HTML menu)
  { from: '7dd077_fdc343a0514e4eaaa36d17db6f777aec.jpg',  to: 'menu-food',   width: 842, quality: 92 },
  { from: '7dd077_89737f8bc614433a8005b0a627444701.jpg',  to: 'menu-drinks', width: 843, quality: 92 },
];

for (const { from, to, width, quality = 82 } of jobs) {
  const img = sharp(`${RAW}/${from}`).rotate().resize({ width, withoutEnlargement: true });
  await img.clone().webp({ quality }).toFile(`${OUT}/${to}.webp`);
  await img.clone().jpeg({ quality, mozjpeg: true }).toFile(`${OUT}/${to}.jpg`);
  const { width: w, height: h } = await sharp(`${OUT}/${to}.jpg`).metadata();
  console.log(`${to}  ${w}x${h}`);
}

// Wordmark keeps transparency → png + webp only
await sharp(`${RAW}/3b2128_1f55e6ceaf874ad8b2e0b6e86e96adcd.png`)
  .resize({ width: 828 }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo.png`);
await sharp(`${RAW}/3b2128_1f55e6ceaf874ad8b2e0b6e86e96adcd.png`)
  .resize({ width: 828 }).webp({ quality: 95 }).toFile(`${OUT}/logo.webp`);

// Google-review badge: the live site crops y_368 h_312 out of the 1080² source
await sharp(`${RAW}/3b2128_1f096804ac3a494e87add112e12f503e.png`)
  .extract({ left: 0, top: 368, width: 1080, height: 312 })
  .resize({ width: 692 }).png({ compressionLevel: 9 }).toFile(`${OUT}/google-review.png`);

// Social share card used on /contact-us
await sharp(`${RAW}/3b2128_735da9af729e4c1180a521b062d28c9f.png`)
  .resize({ width: 1470 }).jpeg({ quality: 85, mozjpeg: true }).toFile(`${OUT}/og-contact.jpg`);

console.log('logo, google-review, og-contact done');
