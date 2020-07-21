const uuid = require('uuid');

function makeWorld (id) {
    return {
        id,
        activeMapId: null,
    }
}

function makeMap (sessionId) {
    const mapId = uuid.v4();

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

module.exports = {
    makeWorld,
    makeMap
}
