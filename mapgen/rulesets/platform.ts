import { OutputRule, Ruleset } from '../types.ts';

const PLATFORM: OutputRule = {
    pattern:
        '     ' +
        '     ' +
        '  x  ' +
        '     ' +
        '     ',
    output: '-',
    chance: 1,
};

const WATERFALL: OutputRule = {
    pattern:
        '     ' +
        '  w  ' +
        '  ^  ' +
        '     ' +
        '     ',
    output: 'w',
    chance: 1,
};

export default [
    PLATFORM,
    WATERFALL,
] as Ruleset;
