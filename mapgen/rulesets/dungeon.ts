import { OutputRule, Ruleset } from '../types.ts';

const WallCornerTL: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  xx ' +
        '  x  ' +
        '     ',
    output: '┏',
    chance: 1,
};

const WallCornerTR: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        ' xx  ' +
        '  x  ' +
        '     ',
    output: '┓',
    chance: 1,
};

const WallCornerBR: OutputRule = {
    pattern:
        '     ' +
        '  x  ' +
        ' xx  ' +
        '     ' +
        '     ',
    output: '┛',
    chance: 1,
};

const WallCornerBL: OutputRule = {
    pattern:
        '     ' +
        '  x  ' +
        '  xx ' +
        '     ' +
        '     ',
    output: '┗',
    chance: 1,
};

const WallCornerHVar1: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  xx ' +
        '     ' +
        '     ',
    output: '═',
    chance: 0.5,
};
const WallCornerH: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  xx ' +
        '     ' +
        '     ',
    output: '━',
    chance: 1,
};

const WallCornerVVar1: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  x  ' +
        '  x  ' +
        '     ',
    output: '║',
    chance: 0.5,
};
const WallCornerV: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  x  ' +
        '  x  ' +
        '     ',
    output: '┃',
    chance: 1,
};
const Ground0: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  .  ' +
        '     ' +
        '     ',
    output: '░',
    chance: 1,
};
const Ground1: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  .  ' +
        '     ' +
        '     ',
    output: '▒',
    chance: 0.5,
};

export default [
    WallCornerTR,
    WallCornerTL,
    WallCornerBL,
    WallCornerBR,

    WallCornerVVar1,
    WallCornerV,

    WallCornerHVar1,
    WallCornerH,

    Ground1,
    Ground0,
] as Ruleset;
