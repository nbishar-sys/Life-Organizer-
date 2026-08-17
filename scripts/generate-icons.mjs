#!/usr/bin/env node
// Generates the app's PNG icons from scratch. No image tools (ImageMagick,
// sharp, …) are assumed to be available, so this renders a gradient +
// glyph pixel-by-pixel and hand-encodes a PNG using only Node's built-in
// zlib for the compressed IDAT chunk. Re-run after changing the design
// below — the output PNGs are committed, this script isn't part of the
// build.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// ---------- Minimal PNG encoder (truecolor RGB, no palette/alpha) ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(width, height, rgb) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const stride = width * 3
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // per-scanline filter type: None
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride)
  }
  const idat = deflateSync(raw, { level: 9 })

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------- Icon design: indigo -> teal gradient with a white sparkle ----------
// The gradient deliberately echoes the built-in Work (indigo) / Personal
// (teal) tag colors. The sparkle nods at "a spark of a thought."

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const TOP_LEFT = hexToRgb('#4f46e5') // indigo-600
const BOTTOM_RIGHT = hexToRgb('#0d9488') // teal-600
const WHITE = [255, 255, 255]

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const abLenSq = abx * abx + aby * aby
  let t = abLenSq === 0 ? 0 : (apx * abx + apy * aby) / abLenSq
  t = clamp(t, 0, 1)
  const cx = ax + t * abx
  const cy = ay + t * aby
  const dx = px - cx
  const dy = py - cy
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Renders a size x size RGB buffer. `safeZone` (0-1) shrinks the glyph
 * toward the center, used for the maskable variant so an aggressive OS
 * crop shape doesn't clip it.
 */
function renderIcon(size, safeZone = 1) {
  const rgb = Buffer.alloc(size * size * 3)

  const r = 0.3 * safeZone
  const armAngles = [90, 210, 330].map((deg) => (deg * Math.PI) / 180)
  const segments = armAngles.map((theta) => {
    const dx = Math.cos(theta) * r
    const dy = Math.sin(theta) * r
    return [(0.5 - dx) * size, (0.5 - dy) * size, (0.5 + dx) * size, (0.5 + dy) * size]
  })
  const strokeHalfWidth = size * 0.06 * safeZone
  const aa = Math.max(1, size / 128)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x / (size - 1) + y / (size - 1)) / 2
      const bg = [
        lerp(TOP_LEFT[0], BOTTOM_RIGHT[0], t),
        lerp(TOP_LEFT[1], BOTTOM_RIGHT[1], t),
        lerp(TOP_LEFT[2], BOTTOM_RIGHT[2], t),
      ]

      let d = Infinity
      for (const [ax, ay, bx, by] of segments) {
        const dist = distToSegment(x, y, ax, ay, bx, by)
        if (dist < d) d = dist
      }
      const coverage = clamp((strokeHalfWidth - d) / aa + 0.5, 0, 1)

      const idx = (y * size + x) * 3
      rgb[idx] = Math.round(lerp(bg[0], WHITE[0], coverage))
      rgb[idx + 1] = Math.round(lerp(bg[1], WHITE[1], coverage))
      rgb[idx + 2] = Math.round(lerp(bg[2], WHITE[2], coverage))
    }
  }

  return rgb
}

function writeIcon(relativePath, size, safeZone = 1) {
  const png = encodePNG(size, size, renderIcon(size, safeZone))
  const outPath = join(publicDir, relativePath)
  writeFileSync(outPath, png)
  console.log(`wrote ${relativePath} (${size}x${size}, ${png.length} bytes)`)
}

mkdirSync(join(publicDir, 'icons'), { recursive: true })
writeIcon('favicon.png', 48)
writeIcon(join('icons', 'icon-180.png'), 180)
writeIcon(join('icons', 'icon-192.png'), 192)
writeIcon(join('icons', 'icon-512.png'), 512)
writeIcon(join('icons', 'icon-512-maskable.png'), 512, 0.7)

console.log('Done.')
