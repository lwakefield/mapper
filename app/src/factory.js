import { v4 as uuid } from 'uuid';

export function makeWorld (id) {
    return {
        id,
        activeMapId: null,
    }
}

const BASE_MAP = (new Array(64)).fill(' '.repeat(64)).join('\n');
export function makeMap (sessionId) {
    const mapId = uuid();

    return {
        id: mapId,
        sessionId,
        grid: BASE_MAP,
        mask: BASE_MAP,
        gmTokens: {},
    };
}

export function makeToken () {
    return {
        id: uuid(),
        x: 0,
        y: 0,
        scale: 1,
        url: `https://api.adorable.io/avatars/285/token-${Math.random()}.png`
    }
}
