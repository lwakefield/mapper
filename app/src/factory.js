import { v4 as uuid } from 'uuid';

export function makeWorld (id) {
    return {
        id,
        activeMapId: null,
    }
}

export function makeMap (sessionId) {
    const mapId = uuid();

    return {
        id: mapId,
        sessionId,
        transform: { x: 0, y: 0, scale: 1 },
        map: {
            size: { width: 64, height: 64 },
            grid: (new Array(64 * 64)).fill(0),
            mask: (new Array(64 * 64)).fill(0)
        },
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
