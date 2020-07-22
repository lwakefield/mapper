<style>
    .tabletop {
        overflow: scroll;
        padding-right: 10px;
        padding-bottom: 10px;
        flex-grow: 1;
    }
    .row {
        display: flex;
        flex-flow: row;
    }
    .sidebar {
        width: 300px;
        padding: 10px;
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

    import Cell from '../../components/Cell.svelte';

    import * as Util from '../../util.js';
    import * as Tools from '../../tools.js';
    import { makeMap, makeToken } from '../../factory.js';

    export let page;

    let socket = null;
    let session = null;
    let maps = {};
    let map = null;
    let mode = 'map';
    let zoom = 1.0;
    let selectedToken = null;
    let tool = { type: 'line', mode: 'draw', mat: 1, temp: null };
    let mods = { shift: false };
    let showMask = true;

    $: map = session && maps[session.activeMapId] || null;

    if (process.browser) {
        socket = SocketIO(`/${page.params.sessionId}`);
        socket.on('initialize:session', s => { session = s; console.log(s); });
        socket.on('update:session',     s => { session = s; console.log(s); });
        socket.on('initialize:map',     m => { maps[m.id] = m; console.log(m); });
        socket.on('update:map',         m => { maps[m.id] = m; console.log(m); });
        socket.connect();

        document.addEventListener('keydown', e => {
            if (e.shiftKey) mods.shift = true;
            if (e.altKey) mods.alt = true;
        });
        document.addEventListener('keyup', e => {
            if (mods.shift && !e.shiftKey) mods.shift = false;
            if (mods.alt && !e.altKey) mods.alt = false;
        });
    }


    async function handleMapMaskToolMouseDown (ev) {
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

            socket.emit('update:map', {
                id: map.id, map: { grid }
            }, (res) => {});

            tool = { ...tool, temp: null };
        }

        const commitMask = (_cells) => {
            const cells = _cells.map(vec => ({
                ...vec,
                val: tool.mode === 'draw' ? 1 : 0
            }));
            const mask = Util.setCells2(map.map.mask, map.map.size, cells);

            socket.emit('update:map', {
                id: map.id, map: { mask }
            }, (res) => {});


            tool = { ...tool, temp: null };
        };

        let commitFn = mode === 'map' ? commit : commitMask;

        tool.type === 'pen'         && Tools.pen(ev, update, commitFn);
        tool.type === 'line'        && Tools.line(ev, update, commitFn);
        tool.type === 'rect'        && Tools.rect(ev, update, commitFn);
        tool.type === 'filled-rect' && Tools.filledRect(ev, update, commitFn);
    }

    async function handleGridToolMouseDown (ev) {
        if (['map', 'mask'].includes(mode)) {
            return handleMapMaskToolMouseDown(ev);
        } else if (mode === 'tokens') {
            if (ev.button !== 0) return;

            const token = { ...makeToken(), ...Tools.toSVGPoint(ev) };
            map.gmTokens[token.id] = token;

            socket.emit('update:map', {
                id: map.id, gmTokens: map.gmTokens
            }, (res) => {});
        }
    }

    async function handleTokenMouseDown (ev, tokenId) {
        if (ev.button !== 0) return;

        selectedToken = map.gmTokens[tokenId];

        ev.stopPropagation();

        if (ev.shiftKey) {
            /* socket.emit('update:map', { */
            /*     id: map.id: { gmTokens: { [tokenId]: null } } */
            /* }, (res) => {}); */
        } else {
            if (ev.altKey) {
                const token = JSON.parse(JSON.stringify(map.gmTokens[tokenId]));
                token.id = uuid.v4();
                tokenId = token.id;
                map.gmTokens[tokenId] = token;
                map = { ...map };
            }

            const update = ({ dx, dy }) => {
                const token = map.gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                map = { ...map };
            };
            const commit = ({ dx, dy }) => {
                const token = map.gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                map = { ...map };

                socket.emit('update:map', {
                    id: map.id, gmTokens: { [tokenId]: token }
                }, (res) => {});
            }
            Tools.movetool(ev, update, commit);
        }
    }

    async function handleSyncActiveMap () {
        socket.emit('update:session', {
            id: session.id,
            activeMapId: session.activeMapId,
        }, (res) => {});
    }

    async function handleSyncActiveToken () {
        socket.emit('update:map', {
            id: map.id,
            gmTokens: { [selectedToken.id]: selectedToken },
        }, (res) => {});
    }

    async function handleDuplicateMap (e) {
        const newMap = JSON.parse(JSON.stringify(map));
        newMap.id = uuid.v4();
        socket.emit('insert:map', newMap, (res) => {});
        session.activeMapId = newMap.id;
        handleSyncActiveMap();
    }

    async function handleNewMap (e) {
        const newMap = makeMap(session.id);
        socket.emit('insert:map', newMap, (res) => {});
        session.activeMapId = newMap.id;
        handleSyncActiveMap();
    }
</script>

<div>
    {#if session}
        <span>Maps:</span>
        <select bind:value={session.activeMapId} on:blur={handleSyncActiveMap}>
            {#each Object.entries(maps || {}) as [ id, m ]}
                <option value={id}>{id}</option>
            {/each}
        </select>
        <button on:click={handleDuplicateMap}>Duplicate Map</button>
        <button on:click={handleNewMap}>New Map</button>
    {/if}


    <button style={showMask && 'background: #ddd'} on:click={() => showMask = !showMask}>Show Mask</button>
    <button on:click={() => zoom *= 1.2}>Zoom In</button>
    <button on:click={() => zoom /= 1.2}>Zoom Out</button>
</div>

{#if map}
    <div class="row" style="overflow: hidden">
        <div class="tabletop">
            <svg
                width={`${100 * zoom}%`}
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
                                on:mousedown={e => handleTokenMouseDown(e, tokenId)}
                                width={token.scale}
                                height="auto"
                                href={token.url}
                                clip-path="url(#clip-avatar)"
                                style={`cursor: ${
                                (mods.shift && 'not-allowed')
                                || (mods.alt && 'copy')
                                || 'move'
                                }`}
                            />
                        {/if}
                    {/each}
                </g>

            </svg>
        </div>
        <div class="sidebar">
            <div>
                <span>Mode:</span>
                <button style={mode === 'map' && 'background: #ddd'}    on:click={() => mode = 'map'}>Map</button>
                <button style={mode === 'mask' && 'background: #ddd'}   on:click={() => mode = 'mask'}>Mask</button>
                <button style={mode === 'tokens' && 'background: #ddd'} on:click={() => mode = 'tokens'}>Token</button>
            </div>

            <hr />

            {#if ['map', 'mask'].includes(mode)}
            <span>Tool:</span>
            <button style={tool.type === 'pen' && 'background: #ddd'}         on:click={() => tool.type = 'pen'}>Pen</button>
            <button style={tool.type === 'line' && 'background: #ddd'}        on:click={() => tool.type = 'line'}>Line</button>
            <button style={tool.type === 'rect' && 'background: #ddd'}        on:click={() => tool.type = 'rect'}>Rectangle</button>
            <button style={tool.type === 'filled-rect' && 'background: #ddd'} on:click={() => tool.type = 'filled-rect'}>Filled Rectangle</button>
            <hr />
            {/if}

            {#if mode === 'map'}
            <span>Material:</span>
            <button style={tool.mat === 1 && 'background: #ddd'} on:click={() => tool.mat = 1}>Wall</button>
            <button style={tool.mat === 2 && 'background: #ddd'} on:click={() => tool.mat = 2}>Path</button>
            <button style={tool.mat === 3 && 'background: #ddd'} on:click={() => tool.mat = 3}>Water</button>
            <button style={tool.mat === 4 && 'background: #ddd'} on:click={() => tool.mat = 4}>Dirt</button>
            <button style={tool.mat === 5 && 'background: #ddd'} on:click={() => tool.mat = 5}>Grass</button>
            <hr />
            {/if}

            {#if selectedToken}
                <div>
                    <img src={selectedToken.url} width="100" />
                    <label class="row">
                        URL:&nbsp;<input type="text" bind:value={selectedToken.url} />
                    </label>
                    <label class="row">
                        Scale:&nbsp;<input type="number" bind:value={selectedToken.scale} on:change={handleSyncActiveToken} />
                    </label>
                    <label class="row">
                        X:&nbsp;<input type="number" bind:value={selectedToken.x} on:change={handleSyncActiveToken} />
                    </label>
                    <label class="row">
                        Y:&nbsp;<input type="number" bind:value={selectedToken.y} on:change={handleSyncActiveToken} />
                    </label>
                </div>
            {/if}
        </div>
    </div>
{/if}
