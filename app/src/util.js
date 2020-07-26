import * as uuid from 'uuid';

import { stores } from '@sapper/app';
import { get } from 'svelte/store';

export function mapGridStr (s, fn) {
  const rows = s.split('\n');
  const height = rows.length;
  const width = rows[0].length;
  let result = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[x + y * width] = fn(rows[y][x], x, y);
    }
  }
  return result;
}

export function quantize (num, steps) {
    return steps * Math.floor(num / steps);
}

export function replaceCharAt (str, index, val) {
  return str.substring(0, index) + val + str.substring(index + 1);
}

export function setCells (s, cells) {
    const rows = s.split('\n');
    const width = rows[0].length;

    for (const {x, y, val} of cells) {
      rows[y] = replaceCharAt(rows[y], x, val)
    }

    return rows.join('\n');
}

// see https://rosettacode.org/wiki/Bitmap/Bresenham%27s_line_algorithm#C
export function line (x0, y0, x1, y1) {
  let [ dx, sx ] = [ Math.abs(x1-x0), x0 < x1 ? 1 : -1 ];
  let [ dy, sy ] = [ Math.abs(y1-y0), y0 < y1 ? 1 : -1 ];
  let err = (dx > dy ? dx : -dy) / 2;
  let e2 = 0;

  let line = [];
  while (true) {
    line.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) return line;
    e2 = err;
    if (e2 > -dx) { err -= dy; x0 += sx; }
    if (e2 < dy) { err += dx; y0 += sy; }
  }
}

export function filledRect(x0, y0, x1, y1) {
  const minx = Math.min(x0, x1);
  const miny = Math.min(y0, y1);
  const maxx = Math.max(x0, x1);
  const maxy = Math.max(y0, y1);

  const width = maxx - minx + 1;
  const height = maxy - miny + 1;
  const rect = new Array(width * height);

  for (let i = 0; i < rect.length; i++) {
    let x = i % width;
    let y = Math.floor(i / width)
    rect[i] = { x: x + minx, y: y + miny };
  }

  return rect;
}

export function rect(x0, y0, x1, y1) {
  const rect = [];

  const minx = Math.min(x0, x1);
  const miny = Math.min(y0, y1);
  const maxx = Math.max(x0, x1);
  const maxy = Math.max(y0, y1);

  for (let x = minx; x <= maxx; x++) {
    rect.push({ x, y: miny });
    rect.push({ x, y: maxy });
  }
  for (let y = miny; y <= maxy; y++) {
    rect.push({ x: minx, y });
    rect.push({ x: maxx, y });
  }
  return rect;
}

export function randInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// sfc32
export function mkrand (_a=0x9E3779B9, _b=0x243F6A88, _c=0xB7E15162, _d=0) {
    let a = _a;
    let b = _b;
    let c = _c;
    let d = _d;
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

export function roll (str) {
    const rolls = str.split('+')
        .map(v => v.trim())
        .filter(Boolean)
        .map(v => {
            let [ num, sides ] = v.split('d');
            if (num === '') num = 1; // d6 instead of 1d6
            if (sides === undefined) sides = 1; // a constant
            return { num: Number(num), sides: Number(sides) };
        });

    const results = [];
    for (const roll of rolls) {
        if (roll.sides === 1) {
            results.push(roll.num);
        } else {
            for (let i = 0; i < roll.num; i++) {
                results.push(randInt(1, roll.sides));
            }
        }
    }

    const total = results.reduce((a, c) => a + c, 0);

    return { results, total };
}

export function getImageURL (url, size) {
  const { session } = stores();
  const { IMAGE_PROXY_HOST } = get(session);
  const u = new URL(url);
  return `${IMAGE_PROXY_HOST}/${size}${u.pathname}`;
}
