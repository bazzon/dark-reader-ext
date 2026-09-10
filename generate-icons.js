const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BG = [0x0a, 0x0f, 0x1c];
const ACCENT = [0x4f, 0x7c, 0xff];

const VIEW = 128;
const CIRCLE_CX = 64;
const CIRCLE_CY = 64;
const CIRCLE_R = 64;
const RING_WIDTH = 3;
const RING_INNER = CIRCLE_R - RING_WIDTH;

const N_HEIGHT = VIEW * 0.6;
const N_TOP = (VIEW - N_HEIGHT) / 2;
const N_BOTTOM = N_TOP + N_HEIGHT;
const N_WIDTH = N_HEIGHT * 0.7;
const N_LEFT = (VIEW - N_WIDTH) / 2;
const N_RIGHT = N_LEFT + N_WIDTH;
const N_STEM = N_HEIGHT * 0.16;

const LEFT_STEM = [
  [N_LEFT, N_TOP],
  [N_LEFT + N_STEM, N_TOP],
  [N_LEFT + N_STEM, N_BOTTOM],
  [N_LEFT, N_BOTTOM]
];

const RIGHT_STEM = [
  [N_RIGHT - N_STEM, N_TOP],
  [N_RIGHT, N_TOP],
  [N_RIGHT, N_BOTTOM],
  [N_RIGHT - N_STEM, N_BOTTOM]
];

const DIAGONAL = [
  [N_LEFT, N_TOP],
  [N_LEFT + N_STEM, N_TOP],
  [N_RIGHT, N_BOTTOM],
  [N_RIGHT - N_STEM, N_BOTTOM]
];

const N_QUADS = [LEFT_STEM, RIGHT_STEM, DIAGONAL];

function pointInQuad(px, py, quad) {
  let sign = 0;
  for (let i = 0; i < quad.length; i++) {
    const ax = quad[i][0];
    const ay = quad[i][1];
    const bx = quad[(i + 1) % quad.length][0];
    const by = quad[(i + 1) % quad.length][1];
    const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    if (cross === 0) continue;
    const current = cross > 0 ? 1 : -1;
    if (sign === 0) sign = current;
    else if (sign !== current) return false;
  }
  return true;
}

function inLetterN(px, py) {
  return N_QUADS.some((quad) => pointInQuad(px, py, quad));
}

function render(size) {
  const ss = 4;
  const out = Buffer.alloc(size * size * 4);

  for (let ty = 0; ty < size; ty++) {
    for (let tx = 0; tx < size; tx++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < ss; sy++) {
        const uy = ((ty * ss + sy) + 0.5) / (size * ss) * VIEW;
        for (let sx = 0; sx < ss; sx++) {
          const ux = ((tx * ss + sx) + 0.5) / (size * ss) * VIEW;

          const dx = ux - CIRCLE_CX;
          const dy = uy - CIRCLE_CY;
          const dist = dx * dx + dy * dy;
          if (dist > CIRCLE_R * CIRCLE_R) continue;

          let color = BG;
          if (dist > RING_INNER * RING_INNER || inLetterN(ux, uy)) {
            color = ACCENT;
          }

          r += color[0];
          g += color[1];
          b += color[2];
          a += 255;
        }
      }

      const n = ss * ss;
      const o = (ty * size + tx) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }

  return out;
}

let CRC_TABLE = null;

function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      CRC_TABLE[i] = c;
    }
  }

  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type, "ascii");
  const check = Buffer.alloc(4);
  check.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, check]);
}

function encodePng(rgba, size) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const outDir = path.join(__dirname, "icons");
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const file = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(file, encodePng(render(size), size));
  console.log(`wrote ${file}`);
}
