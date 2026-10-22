import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const SIZES = [180, 192, 512];
const SAMPLES = 4;
const DESIGN = 512;

const BG = [0x12, 0x35, 0x24];
const TOMATO = [0xc4, 0x55, 0x2d];
const CREAM = [0xf8, 0xf3, 0xe6];
const STEM = [0x2f, 0x5d, 0x33];
const LEAF = [0x7f, 0xb0, 0x69];
const LEAF_LIGHT = [0x98, 0xc0, 0x7c];

const LEAVES = [
  { cx: 256, cy: 158, rx: 34, ry: 62, deg: 0, color: LEAF },
  { cx: 198, cy: 172, rx: 30, ry: 58, deg: -40, color: LEAF },
  { cx: 314, cy: 172, rx: 30, ry: 58, deg: 40, color: LEAF },
  { cx: 224, cy: 140, rx: 26, ry: 52, deg: -22, color: LEAF_LIGHT },
  { cx: 288, cy: 140, rx: 26, ry: 52, deg: 22, color: LEAF_LIGHT }
];

function blend(base, overlay, alpha) {
  return [
    base[0] * (1 - alpha) + overlay[0] * alpha,
    base[1] * (1 - alpha) + overlay[1] * alpha,
    base[2] * (1 - alpha) + overlay[2] * alpha
  ];
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideEllipse(x, y, cx, cy, rx, ry, deg) {
  const rad = (-deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
  const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
  return (localX * localX) / (rx * rx) + (localY * localY) / (ry * ry) <= 1;
}

function insideRoundedRect(x, y, left, top, width, height, radius) {
  const right = left + width;
  const bottom = top + height;
  if (x < left || x > right || y < top || y > bottom) return false;
  const nearLeft = x < left + radius;
  const nearRight = x > right - radius;
  const nearTop = y < top + radius;
  const nearBottom = y > bottom - radius;
  if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
    const cornerX = nearLeft ? left + radius : right - radius;
    const cornerY = nearTop ? top + radius : bottom - radius;
    return insideCircle(x, y, cornerX, cornerY, radius);
  }
  return true;
}

function shade(x, y) {
  let color = BG;

  if (insideCircle(x, y, 256, 296, 138)) color = TOMATO;
  if (insideEllipse(x, y, 208, 252, 58, 36, -32)) color = blend(color, CREAM, 0.16);
  if (insideRoundedRect(x, y, 240, 90, 16, 100, 8)) color = STEM;

  for (const leaf of LEAVES) {
    if (insideEllipse(x, y, leaf.cx, leaf.cy, leaf.rx, leaf.ry, leaf.deg)) {
      color = leaf.color;
    }
  }

  if (insideCircle(x, y, 200, 330, 10)) color = blend(color, CREAM, 0.22);
  if (insideCircle(x, y, 308, 360, 14)) color = blend(color, CREAM, 0.14);
  return color;
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / DESIGN;
  const step = 1 / SAMPLES;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const x = (px + (sx + 0.5) * step) / scale;
          const y = (py + (sy + 0.5) * step) / scale;
          const color = shade(x, y);
          r += color[0];
          g += color[1];
          b += color[2];
        }
      }
      const count = SAMPLES * SAMPLES;
      const offset = (py * size + px) * 4;
      pixels[offset] = Math.round(r / count);
      pixels[offset + 1] = Math.round(g / count);
      pixels[offset + 2] = Math.round(b / count);
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

let crcTable;

function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of SIZES) {
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, png(size, render(size)));
  console.log(`wrote ${file}`);
}
