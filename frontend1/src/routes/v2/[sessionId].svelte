<style>
    .tabletop {
        overflow: scroll;
        padding-right: 10px;
        padding-bottom: 10px;
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
    import * as Lib from '@mapper/lib';

    import Cell from '../../components/Cell.svelte';

    import * as Util from '../../util.js';
    import * as Tools from '../../tools.js';

    export let page;

    let socket = null;
    let world = null;
    let map = null;
    let mode = 'map';
    let zoom = 1.0;
    let tool = { type: 'line', mode: 'draw', mat: 1, temp: null };
    let mods = { shift: false };
    let showMask = true;

    $: map = world && world.maps[world.activeMapId];

    if (process.browser) {
        socket = SocketIO(`http://localhost:3001/${page.params.sessionId}`);
        socket.once('initialize', w => { world = w; console.log(w); });
        socket.on('update',       w => { world = w; console.log(w); });
        socket.connect();

        document.addEventListener('keydown', e => {
            if (e.shiftKey) mods.shift = true;
        });
        document.addEventListener('keyup', e => {
            if (mods.shift && !e.shiftKey) mods.shift = false;
        });
    }


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
            const grid = Util.setCells(map.map, cells);

            socket.emit('update', {
                maps: { [map.id]: { map: { grid } } }
            }, (res) => {});

            tool = { ...tool, temp: null };
        }

        const commitMask = (_cells) => {
            const cells = _cells.map(vec => ({
                ...vec,
                val: tool.mode === 'draw' ? 1 : 0
            }));
            const mask = Util.setCells2(map.map.mask, map.map.size, cells);

            socket.emit('update', {
                maps: { [map.id]: { map: { mask } } }
            }, (res) => {});


            tool = { ...tool, temp: null };
        };

        let commitFn = mode === 'map' ? commit : commitMask;

        tool.type === 'pen'         && Tools.pen(ev, update, commitFn);
        tool.type === 'line'        && Tools.line(ev, update, commitFn);
        tool.type === 'rect'        && Tools.rect(ev, update, commitFn);
        tool.type === 'filled-rect' && Tools.filledRect(ev, update, commitFn);

        if (tool.type === 'gm-token') {
            const point = Tools.toSVGPoint(ev);
            map.gmTokens[uuid.v4()] = {
                ...point,
                url: `https://api.adorable.io/avatars/285/token-${Util.randInt(0, 1024)}.png`
            };

            socket.emit('update', {
                maps: { [map.id]: { gmTokens: map.gmTokens } }
            }, (res) => {});
        }
    }

    async function handleTokenMouseDown (ev, mapIndex, tokenId) {
        if (ev.button !== 0) return;

        ev.stopPropagation();

        if (ev.shiftKey) {
            socket.emit('update', {
                maps: { [map.id]: { gmTokens: { [tokenId]: null } } }
            }, (res) => {});
        } else {
            const update = ({ dx, dy }) => {
                const token = map.gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                world = { ...world };
            };
            const commit = ({ dx, dy }) => {
                const token = map.gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                world = { ...world };

                socket.emit('update', {
                    maps: { [map.id]: { gmTokens: { [tokenId]: token } } }
                }, (res) => {});
            }
            Tools.movetool(ev, update, commit);
        }
    }

    async function handleSyncActiveMap (e) {
        socket.emit('update', {
            activeMapId: world.activeMapId,
        }, (res) => {});
    }

    async function handleDuplicateMap (e) {
        const newMap = JSON.parse(JSON.stringify(map));
        newMap.id = uuid.v4();
        socket.emit('update', {
            activeMapId: newMap.id,
            maps: { [newMap.id]: newMap }
        }, (res) => {});
    }

    async function handleNewMap (e) {
        const newMap = Lib.makeMap();
        socket.emit('update', {
            activeMapId: newMap.id,
            maps: { [newMap.id]: newMap }
        }, (res) => {});
    }
</script>

<div>
    {#if world}
        <span>Maps:</span>
        <select bind:value={world.activeMapId} on:blur={handleSyncActiveMap}>
            {#each Object.entries(world ? world.maps : {}) as [ id, m ]}
                <option value={id}>{id}</option>
            {/each}
        </select>
        <button on:click={handleDuplicateMap}>Duplicate Map</button>
        <button on:click={handleNewMap}>New Map</button>
    {/if}

    <span>&nbsp;&nbsp;</span>

    <span>Mode:</span>
    <button style={mode === 'map' && 'background: #ddd'}    on:click={() => mode = 'map'}>Map</button>
    <button style={mode === 'mask' && 'background: #ddd'}   on:click={() => mode = 'mask'}>Mask</button>
    <button style={mode === 'tokens' && 'background: #ddd'} on:click={() => mode = 'tokens'}>Token</button>

    <span>&nbsp;&nbsp;</span>

    {#if ['map', 'mask'].includes(mode)}
    <span>Tool:</span>
    <button style={tool.type === 'pen' && 'background: #ddd'}         on:click={() => tool.type = 'pen'}>Pen</button>
    <button style={tool.type === 'line' && 'background: #ddd'}        on:click={() => tool.type = 'line'}>Line</button>
    <button style={tool.type === 'rect' && 'background: #ddd'}        on:click={() => tool.type = 'rect'}>Rectangle</button>
    <button style={tool.type === 'filled-rect' && 'background: #ddd'} on:click={() => tool.type = 'filled-rect'}>Filled Rectangle</button>
    <button style={tool.type === 'gm-token' && 'background: #ddd'}    on:click={() => tool.type = 'gm-token'}>GM Token</button>
    <span>&nbsp;&nbsp;</span>
    {/if}

    {#if mode === 'map'}
    <span>Material:</span>
    <button style={tool.mat === 1 && 'background: #ddd'} on:click={() => tool.mat = 1}>Wall</button>
    <button style={tool.mat === 2 && 'background: #ddd'} on:click={() => tool.mat = 2}>Path</button>
    <button style={tool.mat === 3 && 'background: #ddd'} on:click={() => tool.mat = 3}>Water</button>
    <button style={tool.mat === 4 && 'background: #ddd'} on:click={() => tool.mat = 4}>Dirt</button>
    <button style={tool.mat === 5 && 'background: #ddd'} on:click={() => tool.mat = 5}>Grass</button>
    <span>&nbsp;&nbsp;</span>
    {/if}

    <button style={showMask && 'background: #ddd'} on:click={() => showMask = !showMask}>Show Mask</button>
    <button on:click={() => zoom *= 1.2}>Zoom In</button>
    <button on:click={() => zoom /= 1.2}>Zoom Out</button>
</div>

{#if map}
    <div class="tabletop">
        <svg
            width={`${100 * zoom}%`}
            x={map.transform.x}
            y={map.transform.y}
            viewBox={`0 0 ${map.map.size.width} ${map.map.size.height}`}
            shape-rendering="crispEdges"
            on:mousedown={e => handleGridToolMouseDown(e)}
        >

            <defs>
                <clipPath id="clip-avatar" clipPathUnits="objectBoundingBox">
                    <circle cx="0.5" cy="0.5" r="0.5" />
                </clipPath>

                <pattern id="stripe" width={0.7 / zoom} height={0.7 / zoom} patternUnits="userSpaceOnUse" >
                    <line x1="0" y1="0" x2={0.7 / zoom} y2={0.7 / zoom}
                        stroke="black"
                        vector-effect="non-scaling-stroke"
                        stroke-width="1px"
                    />
                </pattern>

                <pattern id="hatch" width={0.5 / zoom} height={0.5 / zoom} patternTransform="rotate(-5)" patternUnits="userSpaceOnUse" >
                    <line x1="0" y1="0" x2={0.5 / zoom} y2={0.5 / zoom}
                        stroke="black"
                        vector-effect="non-scaling-stroke"
                        stroke-width="2px"
                    />
                    <line x1={0} y1={0.5 / zoom} x2={0.5 / zoom} y2={0}
                        stroke="black"
                        vector-effect="non-scaling-stroke"
                        stroke-width="2px"
                    />
                </pattern>
            </defs>

            <mask id="fogOfWar">
                {#each Util.mapGrid2(map.map.mask, map.map.size, (val, x, y) => ({ val, x, y})) as { val, x, y }}
                    <rect
                        x={x} y={y}
                        width={1} height={1}
                        fill={(val === 0 && '#fff') || '#aaa'}
                        />
                {/each}
            </mask>

            <g mask={showMask ? 'url(#fogOfWar)' : ''}>
                {#each Util.mapGrid(map.map, (val, x, y) => ({ val, x, y})) as { val, x, y }}
                    <Cell x={x} y={y} val={val} />
                {/each}

                {#if tool.temp }
                    {#each tool.temp as {x, y}}
                        <Cell x={x} y={y} />
                    {/each}
                {/if}

                {#each Object.entries(map.gmTokens) as [ tokenId, token ]}
                    {#if token}
                        <image
                            x={token.x} y={token.y}
                            on:mousedown={e => handleTokenMouseDown(e, undefined, tokenId)}
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
            </g>

        </svg>
    </div>
{/if}
