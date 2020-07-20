<style>
    .tabletop {
        overflow: scroll;
    }
</style>

<script context="module">
    export async function preload(page, session) {
        return { page };
    }
</script>

<script>
    import { stores } from '@sapper/app';
    import * as uuid from 'uuid';
    import SocketIO from 'socket.io-client';

    import * as Util from '../../util.js';
    import * as Tools from '../../tools.js';

    export let page;

    let socket = null;
    let world = null;
    let worldSize;
    $: worldSize = world && Util.getWorldSize(world);

    if (process.browser) {
        socket = SocketIO(`http://localhost:3001/${page.params.sessionId}`);
        socket.once('initialize', w => { world = w; console.log(w); });
        socket.on('update',       w => { world = w; console.log(w); });
        socket.connect();
    }

    let zoom = 1.0;
    let tool = { type: 'line', mode: 'draw', start: null, mat: 1, temp: null };

    async function handleGridToolMouseDown (ev, mapIndex) {
        if (ev.button !== 0) return;

        tool.mode = ev.shiftKey ? 'erase' : 'draw';

        const update = (cells) => {
            tool = { ...tool, temp: cells };
        };
        const commit = (_cells) => {
            const cells = _cells.map(vec => ({
                ...vec,
                val: tool.mode === 'draw' ? tool.mat : 0
            }));
            const map = world.maps[mapIndex];
            const grid = Util.setCells(map.map, cells);

            socket.emit('update', {
                maps: { [mapIndex]: { map: { grid } } }
            }, (res) => {});

            tool = { ...tool, temp: null };
        }

        tool.type === 'pen'         && Tools.pen(ev, update, commit);
        tool.type === 'line'        && Tools.line(ev, update, commit);
        tool.type === 'rect'        && Tools.rect(ev, update, commit);
        tool.type === 'filled-rect' && Tools.filledRect(ev, update, commit);

        if (tool.type === 'gm-token') {
            const point = Tools.toSVGPoint(ev);
            const map = world.maps[mapIndex];
            // TODO: remove
            if (!map.gmTokens) map.gmTokens = {};
            map.gmTokens[uuid.v4()] = {
                ...point,
                url: `https://api.adorable.io/avatars/285/token-${Util.randInt(0, 1024)}.png`
            };

            socket.emit('update', {
                maps: { [mapIndex]: { gmTokens: map.gmTokens } }
            }, (res) => {});
        }
    }

    let mods = { shift: false };
    if (process.browser) {
        document.addEventListener('keydown', e => {
            if (e.shiftKey) mods.shift = true;
        });
        document.addEventListener('keyup', e => {
            if (mods.shift && !e.shiftKey) mods.shift = false;
        });
    }

    async function handleTokenMouseDown (ev, mapIndex, tokenId) {
        if (ev.button !== 0) return;

        if (ev.shiftKey) {
            socket.emit('update', {
                maps: { [mapIndex]: { gmTokens: { [tokenId]: null } } }
            }, (res) => {});
        } else {
            const update = ({ dx, dy }) => {
                const token = world.maps[mapIndex].gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                world = { ...world };
            };
            const commit = ({ dx, dy }) => {
                const token = world.maps[mapIndex].gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                world = { ...world };

                socket.emit('update', {
                    maps: { [mapIndex]: { gmTokens: { [tokenId]: token } } }
                }, (res) => {});
            }
            Tools.movetool(ev, update, commit);
        }
    }
</script>

<div>
    <button style={tool.type === 'pen' && 'background: #ddd'}         on:click={() => tool.type = 'pen'}>Pen</button>
    <button style={tool.type === 'line' && 'background: #ddd'}        on:click={() => tool.type = 'line'}>Line</button>
    <button style={tool.type === 'rect' && 'background: #ddd'}        on:click={() => tool.type = 'rect'}>Rectangle</button>
    <button style={tool.type === 'filled-rect' && 'background: #ddd'} on:click={() => tool.type = 'filled-rect'}>Filled Rectangle</button>
    <button style={tool.type === 'gm-token' && 'background: #ddd'}    on:click={() => tool.type = 'gm-token'}>GM Token</button>
    <button style={tool.type === 'mask' && 'background: #ddd'}        on:click={() => tool.type = 'mask'}>Mask</button>

    <span>&nbsp;&nbsp;</span>

    <button style={tool.mat === 1 && 'background: #ddd'} on:click={() => tool.mat = 1}>Wall</button>
    <button style={tool.mat === 2 && 'background: #ddd'} on:click={() => tool.mat = 2}>Path</button>
    <button style={tool.mat === 3 && 'background: #ddd'} on:click={() => tool.mat = 3}>Water</button>

    <span>&nbsp;&nbsp;</span>

    <button on:click={() => zoom *= 1.2}>Zoom In</button>
    <button on:click={() => zoom /= 1.2}>Zoom Out</button>
</div>

{#if world}
    <div class="tabletop">
        <svg
            width={`${100 * zoom}%`}
            viewBox={`0 0 ${worldSize.width} ${worldSize.height}`}
        >
            {#each Object.entries(world.maps) as [ mapIndex, map ]}
                <svg
                    x={map.transform.x}
                    y={map.transform.y}
                    viewBox={`0 0 ${map.map.size.width} ${map.map.size.height}`}
                    shape-rendering="crispEdges"
                >
                    <defs>
                        <clipPath id="clip-avatar" clipPathUnits="objectBoundingBox">
                            <circle cx="0.5" cy="0.5" r="0.5" />
                        </clipPath>
                    </defs>
                    {#each Util.mapGrid(map.map, (val, x, y) => ({ val, x, y})) as { val, x, y }}
                        <rect
                            x={x} y={y}
                            width={1} height={1}
                            on:mousedown={(e) => handleGridToolMouseDown(e, mapIndex)}
                            fill={
                            (val === 1 && '#333')
                            || (val === 2 && '#999')
                            || (val === 3 && '#6960EC')
                            || 'white'
                            }
                            vector-effect="non-scaling-stroke"
                            stroke="#eee"
                            stroke-width="1px"
                        />
                    {/each}
                    {#if tool.temp }
                        {#each tool.temp as {x, y}}
                            <rect
                                x={x} y={y}
                                width={1} height={1}
                                fill={'purple'}
                                vector-effect="non-scaling-stroke"
                                stroke="#eee"
                                stroke-width="1px"
                                />
                        {/each}
                    {/if}

                    {#each Object.entries(map.gmTokens) as [ tokenId, token ]}
                        {#if token}
                            <image
                                x={token.x} y={token.y}
                                on:mousedown={e => handleTokenMouseDown(e, mapIndex, tokenId)}
                                width={1}
                                height={1}
                                href={token.url}
                                clip-path="url(#clip-avatar)"
                                style={`cursor: ${
                                    (mods.shift && 'not-allowed')
                                    || 'move'
                                }`}
                            />
                        {/if}
                    {/each}
                </svg>
            {/each}
        </svg>
    </div>
{/if}

