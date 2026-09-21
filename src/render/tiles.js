import { hash2 } from '../core/rng.js';
import { TUNING } from '../data/tuning.js';

/**
 * 程序化草地 tile（docs/26：16/32px tile 地面，暖色，不用水彩当地面）。
 * 每块 32×32 世界 px，用 2px「大像素」画，烘焙成设备像素画布，运行时 1:1 贴。
 */
const PAL = {
  grassA: '#a9c98c', grassB: '#a5c588', tuft: '#8fb377', tuftDark: '#7fa46a', speck: '#b8d69b',
  flowerRose: '#e79b93', flowerCream: '#fff3dc', flowerGold: '#f0c86a',
  sand: '#e5d2ab', sandSpeck: '#d9c297', sandLight: '#efe0bf',
  hedge: '#7c9f6a', hedgeDark: '#6a8d5b', hedgeLight: '#93b57f',
};

function bakeOne(k, paint) {
  const size = Math.round(TUNING.tile * k);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const u = size / 16; // 一个大像素 = 2 世界 px
  const px = (x, y, color, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x * u), Math.round(y * u), Math.ceil(w * u), Math.ceil(h * u)); };
  paint(px, size, ctx);
  return c;
}

function grassTile(k, variant) {
  return bakeOne(k, (px, size, ctx) => {
    ctx.fillStyle = variant % 2 ? PAL.grassB : PAL.grassA;
    ctx.fillRect(0, 0, size, size);
    const seed = variant * 17 + 3;
    const n = 6 + (variant % 3) * 2;
    for (let i = 0; i < n; i++) {
      const x = Math.floor(hash2(i, seed, 1) * 15), y = Math.floor(hash2(i, seed, 2) * 14);
      const dark = hash2(i, seed, 3) > 0.6;
      px(x, y, dark ? PAL.tuftDark : PAL.tuft, 1, 2);
      if (hash2(i, seed, 4) > 0.5) px(x + 1, y + 1, PAL.tuft, 1, 1);
    }
    for (let i = 0; i < 5; i++) px(Math.floor(hash2(i, seed, 5) * 16), Math.floor(hash2(i, seed, 6) * 16), PAL.speck);
    if (variant === 2 || variant === 5) {
      const fx = 4 + Math.floor(hash2(variant, 9, 1) * 8), fy = 4 + Math.floor(hash2(variant, 9, 2) * 8);
      const col = variant === 2 ? PAL.flowerRose : PAL.flowerGold;
      px(fx - 1, fy, col); px(fx + 1, fy, col); px(fx, fy - 1, col); px(fx, fy + 1, col); px(fx, fy, PAL.flowerCream);
    }
  });
}

function sandTile(k, variant) {
  return bakeOne(k, (px, size, ctx) => {
    ctx.fillStyle = PAL.sand;
    ctx.fillRect(0, 0, size, size);
    const seed = 40 + variant;
    for (let i = 0; i < 7; i++) px(Math.floor(hash2(i, seed, 1) * 16), Math.floor(hash2(i, seed, 2) * 16), PAL.sandSpeck);
    for (let i = 0; i < 4; i++) px(Math.floor(hash2(i, seed, 3) * 16), Math.floor(hash2(i, seed, 4) * 16), PAL.sandLight, 2, 1);
  });
}

function hedgeTile(k) {
  return bakeOne(k, (px, size, ctx) => {
    ctx.fillStyle = PAL.hedge;
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(hash2(i, 77, 1) * 14), y = Math.floor(hash2(i, 77, 2) * 14);
      px(x, y, PAL.hedgeDark, 2, 2); px(x, y, PAL.hedgeLight, 1, 1);
    }
  });
}

export function bakeTiles(k) {
  return {
    grass: [0, 1, 2, 3, 4, 5].map((v) => grassTile(k, v)),
    sand: [0, 1].map((v) => sandTile(k, v)),
    hedge: hedgeTile(k),
    size: Math.round(TUNING.tile * k),
  };
}

/** 双线性值噪声（沙地斑块用） */
function valueNoise(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0, 5), b = hash2(x0 + 1, y0, 5), c = hash2(x0, y0 + 1, 5), d = hash2(x0 + 1, y0 + 1, 5);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

/** 取某格 tile 画布 */
export function tileAt(tiles, tx, ty) {
  const { w, h } = TUNING.world;
  const t = TUNING.tile;
  if (tx < 0 || ty < 0 || tx * t >= w || ty * t >= h) return tiles.hedge;
  if (valueNoise(tx / 4.5, ty / 4.5) > 0.83) return tiles.sand[Math.floor(hash2(tx, ty, 8) * 2)];
  const r = hash2(tx, ty, 1);
  // 花朵变体（2、5）少一点
  const v = r < 0.06 ? 2 : r < 0.1 ? 5 : ((tx + ty) & 1) ? [1, 3][Math.floor(hash2(tx, ty, 2) * 2)] : [0, 4][Math.floor(hash2(tx, ty, 2) * 2)];
  return tiles.grass[v];
}
