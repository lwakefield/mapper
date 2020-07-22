import * as uuid from 'uuid';

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

export function getCell (s, { x, y }) {
    const rows = s.split('\n');
	return rows[y][x];
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
  const rect = [];

  const minx = Math.min(x0, x1);
  const miny = Math.min(y0, y1);
  const maxx = Math.max(x0, x1);
  const maxy = Math.max(y0, y1);

  for (let x = minx; x <= maxx; x++) {
    for (let y = miny; y <= maxy; y++) {
      rect.push({ x, y });
    }
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
