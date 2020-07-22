interface Mapp {
    grid: string;
    width: number;
    height: number;
}

interface OutputRule {
    pattern: string; // expected to be 25 char long
    output: string;
    chance: number;
}

type Ruleset = Array<OutputRule>;

interface Vec {
    x: number;
    y: number;
}

interface Size {
    width: number;
    height: number;
}

type Rect = Vec & Size;
