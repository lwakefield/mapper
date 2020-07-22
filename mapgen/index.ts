import { Mapp, OutputRule, Ruleset } from './types.ts';
import DUNGEON_RULESET from './rulesets/dungeon.ts';
import PLAFORM_RULESET from './rulesets/platform.ts';



function getSubMap (map : Mapp, rect : Rect) {
    let ystop = rect.y + rect.height;
    let xstop = rect.x + rect.width;

    let res: Mapp = {
        grid: '',
        width: rect.width,
        height: rect.height
    }

    for (let dy = 0; dy < rect.height; dy++) {
        for (let dx = 0; dx < rect.width; dx++) {
            let x = rect.x + dx;
            let y = rect.y + dy;

            if (x < 0 || x >= map.width) {
                res.grid += ' ';
            } else if (y < 0 || y >= map.height) {
                res.grid += ' ';
            } else {
                res.grid += map.grid[x + y * map.width];
            }
        }
    }

    return res;
}

function mapsEQ (a : Mapp, b : Mapp) {
    if (a.width !== b.width) return false;
    if (a.height !== b.height) return false;

    return a.grid === b.grid;
}

function patternMatch (m : Mapp, p : string) {
    if (m.height !== 5 || m.width !== 5) throw new Error('map size too large');

    for (let i = 0; i < 25; i++) {
        if (p[i] === ' ') continue;
        if (p[i] === '^' && m.grid[i] === ' ') continue;
        if (p[i] === '$' && m.grid[i] !== ' ') continue;
        if (p[i] !== m.grid[i]) return false;
    }

    return true;
}

function mapToString (map : Mapp) {
    const lines = [];
    for (let y = 0; y < map.height; y++) {
        lines.push(map.grid.slice(y * map.width, (y * map.width) + map.width));
    }
    return lines.join('\n');
}

function cloneMap (map : Mapp) {
    return {
        ...map
    }
}

let seed = [0x9E3779B9, 0x243F6A88, 0xB7E15162, 0]
function rand_uint32() {
    return Math.floor(Math.random() * 4294967296);
}
function mkrand (_a=0x9E3779B9, _b=0x243F6A88, _c=0xB7E15162, _d=0) {
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

function gen (map : Mapp, ruleset : Ruleset, iterations=1) {
    let rand = mkrand();

    let curr = cloneMap(map);
    let next = cloneMap(curr);

    for (let i = 0; i < iterations; i++) {
        for (let y = 0; y < curr.height; y++) {
            for (let x = 0; x < curr.width; x++) {
                const sub = getSubMap(curr, { x: x - 2, y: y - 2, width: 5, height: 5 });

                for (let rule of ruleset) {
                    if (patternMatch(sub, rule.pattern) && rand() <= rule.chance) {

                        let offset = x + y * curr.width
                        next.grid = next.grid.substring(0, offset)
                        + rule.output
                        + next.grid.substring(offset + 1);

                        break;
                    }
                }
            }
        }
        curr = cloneMap(next);
    }

    return next;
}

const TEST_MAP_1: Mapp = {
    grid:
        '        ' +
        ' xxxxxx ' +
        ' x....x ' +
        ' xx...x ' +
        '  x.xxx ' +
        '  x.x   ' +
        '  xxx   ' +
        '        ',
    width: 8,
    height: 8,
}
console.log(
    mapToString(gen(TEST_MAP_1, DUNGEON_RULESET))
);

const TEST_MAP_2: Mapp = {
    grid:
        '    wxx ' +
        ' xx     ' +
        '        ' +
        '        ' +
        '    xxx ' +
        '        ' +
        '        ' +
        '        ',
    width: 8,
    height: 8,
}
console.log(
    mapToString(gen(TEST_MAP_2, PLAFORM_RULESET, 5))
);
