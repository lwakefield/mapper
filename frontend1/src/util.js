import * as uuid from 'uuid';

export function makeWorld () {
  return {
      maps: {
          [uuid.v4()]: {
              transform: { x: 0, y: 0, scale: 1 },
              map: {
                  size: { width: 64, height: 64 },
                  grid: (new Array(64 * 64)).fill(0)
              },
              gmTokens: {}
          }
      }
  }
}

export function getWorldSize (w) {
  const maps = Object.values(w.maps);
  const [ width ] = maps.map(v => v.transform.x + v.map.size.width).sort()
  const [ height ] = maps.map(v => v.transform.y + v.map.size.height).sort();
  return { width, height };
}

export function quantize (num, steps) {
    return steps * Math.floor(num / steps);
}

export function mapGrid (map, fn) {
    const result = new Array(map.size.height * map.size.width);
    let start = Date.now();
    for (let y = 0; y < map.size.height; y++) {
        for (let x = 0; x < map.size.width; x++) {
            const offset = x + y * map.size.width;
            result[offset] = fn( map.grid[offset], x, y);
        }
    }

    return result;
}

export function getCell (map, x, y) {
    const offset = x + y * map.size.width;
    return map.grid[offset];
}

export function setCell (map, x, y, val) {
    const newGrid = map.grid.concat();
    const offset = x + y * map.size.width;
    newGrid[offset] = val;
    return newGrid;
}

export function setCells (map, cells) {
    const newGrid = map.grid.concat();
    for (const {x, y, val} of cells) {
      const offset = x + y * map.size.width;
      newGrid[offset] = val;
    }
    return newGrid;
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
