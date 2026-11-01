// Generate simple branded PNG icons using only Node built-ins.
const fs = require('node:fs');
const zlib = require('node:zlib');
function png(size) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4); row[0] = 0;
    for (let x = 0; x < size; x++) {
      const i = 1 + x * 4; const inset = Math.round(size * .08);
      const inBox = x >= inset && y >= inset && x < size - inset && y < size - inset;
      row[i] = inBox ? 29 : 255; row[i + 1] = inBox ? 155 : 255; row[i + 2] = inBox ? 240 : 255; row[i + 3] = 255;
      // White X mark, drawn as two thick diagonals.
      const d1 = Math.abs(y - x), d2 = Math.abs(y - (size - 1 - x)), thick = Math.max(1, size * .09);
      if (inBox && d1 < thick && d2 < thick) { row[i] = 255; row[i + 1] = 255; row[i + 2] = 255; }
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const name = Buffer.from(type); const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(Buffer.concat([name, data]))); return Buffer.concat([len, name, data, sum]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const size of [16, 48, 128]) fs.writeFileSync(`icons/icon${size}.png`, png(size));
