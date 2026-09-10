const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const DARK = [0x1b, 0x1b, 0x2f];
const GOLD = [0xf6, 0xd9, 0x92];

const VIEW = 128;
const DISC_CX = 64;
const DISC_CY = 64;
const DISC_R = 62;
const MOON_R = 46;
const BITE_CX = 52;
const BITE_CY = 54;
const BITE_R = 37;

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

          const ddx = ux - DISC_CX;
          const ddy = uy - DISC_CY;
          if (ddx * ddx + ddy * ddy > DISC_R * DISC_R) continue;

          const bdx = ux - BITE_CX;
          const bdy = uy - BITE_CY;
          const bitten = bdx * bdx + bdy * bdy <= BITE_R * BITE_R;
          const isMoon = !bitten && ddx * ddx + ddy * ddy <= MOON_R * MOON_R;
          const color = isMoon ? GOLD : DARK;

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
