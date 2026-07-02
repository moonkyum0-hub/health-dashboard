import { createRequire } from "module";
import { mkdirSync } from "fs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

// 심박수 라인이 있는 건강 앱 아이콘 (브랜드 컬러 blue-600)
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#2563eb"/>
  <polyline
    points="60,256 155,256 205,130 258,385 310,205 360,256 452,256"
    fill="none"
    stroke="white"
    stroke-width="46"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;

mkdirSync("public/icons", { recursive: true });

const buf = Buffer.from(SVG);

await sharp(buf).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(buf).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(buf).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");
await sharp(buf).resize(32, 32).png().toFile("public/favicon-32.png");

console.log("✓ Icons generated in public/icons/");
