<style>
    .tabletop {
        overflow: scroll;
        padding-right: 10px;
        padding-bottom: 10px;
        flex-basis: 0;
        flex-grow: 1;
    }
    .row {
        display: flex;
        flex-flow: row;
    }
    .sidebar {
        width: 350px;
        padding: 10px;
    }
    .vspace {
        margin-top: 5px;
        margin-bottom: 5px;
    }
    .selected {
        background: #ddd;
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
    import Map from '../../components/Map.svelte';
    import FOW from '../../components/Map/FOW.svelte';
    import Tokens from '../../components/Map/Tokens.svelte';

    import * as Game from '../../stores/game.js';

    import * as Util from '../../util.js';
    import * as Tools from '../../tools.js';
    import { makeMap, makeToken } from '../../factory.js';
    import { TILE_TYPES } from '../../tiles.js';

    export let page;

    let socket = null;
    let session, maps;
    let map = null;
    let mapSize = null;
    let mode = 'map';
    let zoom = 1.0;
    let selectedToken = null;
    let tool = { type: 'pen', mode: 'draw', mat: '#', temp: null };
    let mods = { shift: false };
    let displayOptions = {
        mask: true,
        gmTokens: true
    };

    if (process.browser) {
        Game.init(page.params.sessionId);
        Game.store.subscribe(state => {
            ({ session, maps } = state);

            if (session && maps[session.activeMapId]) {
                map = maps[session.activeMapId];
                let rows = map.grid.split('\n');
                mapSize = { width: rows[0].length, height: rows.length };
            }
        });


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

        if (ev.altKey) {
            let { x, y } = Tools.quantizeSVGPoint(Tools.toSVGPoint(ev));

            tool.mat = map.grid.split('\n')[y][x];
        }

        tool.mode = ev.shiftKey ? 'erase' : 'draw';

        const update = (cells) => {
            tool = { ...tool, temp: cells };
        };
        const commit = async (_cells) => {
            const cells = _cells.map(vec => ({
                ...vec,
                val: tool.mode === 'draw' ? tool.mat : ' '
            }));
            const grid = Util.setCells(map.grid, cells);

            await Game.updateActiveMap({ grid });

            tool = { ...tool, temp: null };
        }

        const commitMask = async (_cells) => {
            const cells = _cells.map(vec => ({
                ...vec,
                val: tool.mode === 'draw' ? '#' : ' '
            }));
            const mask = Util.setCells(map.mask, cells);

            await Game.updateActiveMap({ mask });

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

            await Game.updateActiveMap({ gmTokens: { [token.id]: token } });
        }
    }

    async function handleTokenMouseDown (ev, tokenId) {
        if (ev.button !== 0) return;

        if (mode !== 'token') mode = 'tokens';

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
            const commit = async ({ dx, dy }) => {
                const token = map.gmTokens[tokenId];
                token.x += dx;
                token.y += dy;
                map = { ...map };

                await Game.updateActiveMap({ gmTokens: { [token.id]: token } });
            }
            Tools.movetool(ev, update, commit);
        }
    }

    async function handleSyncActiveToken () {
        await Game.updateActiveMap({ gmTokens: { [selectedToken.id]: selectedToken } });
    }

    async function handleCloneMap (m) {
        const newMap = JSON.parse(JSON.stringify(map));
        newMap.id = uuid.v4();
        newMap.name += ' copy';
        await Game.insertMap(newMap);
        await Game.updateSession({ activeMapId: newMap.id });
    }

    async function handleNewMap (e) {
        const newMap = makeMap(session.id);
        await Game.insertMap(newMap);
        await Game.updateSession({ activeMapId: newMap.id });
    }
</script>

{#if map}
    <div class="row" style="overflow: hidden">
        <div class="tabletop">
            <Map
                grid={map.grid} zoom={zoom}
                onmousedown={e => handleGridToolMouseDown(e)}
            >
                <g slot="fogOfWar">
                    <FOW
                        mask={map.mask}
                        fill={displayOptions.mask ? '#444' : '#fff'}
                    />
                </g>

                {#each tool.temp || [] as {x, y}}
                    <Cell x={x} y={y} fill="purple" stroke="#eee" />
                {/each}

                {#if displayOptions.gmTokens}
                    <Tokens
                        tokens={map.gmTokens}
                        onmousedown={handleTokenMouseDown}
                        style={`cursor: ${
                            (mods.shift && 'not-allowed')
                            || (mods.alt && 'copy')
                            || 'move'
                        }`}
                    />
                {/if}

            </Map>
        </div>

        <div class="sidebar">
            {#if session}
                <fieldset>
                    <legend>Map</legend>

                    <div style="max-height: 200px; width: 100%; overflow: scroll;">
                        {#each Object.entries(maps || {}) as [ id, m ]}
                            <div class:selected={session.activeMapId === id} style="display: flex; justify-content: space-between;">
                                <div
                                    style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 150px;"
                                    on:click={e => Game.updateSession({ activeMapId: id }) }
                                >{m.name}</div>

                                <button on:click={e => handleCloneMap(m)}>Clone</button>
                            </div>
                        {/each}
                        <div>
                            <button on:click={handleNewMap}>New Map</button>
                        </div>

                    </div>

                    <label class="row">
                        Map Name:&nbsp;<input type="text" value={map.name} on:blur={e => Game.updateActiveMap({ name: e.target.value })} />
                    </label>
                </fieldset>
            {/if}

            <hr />

            <fieldset>
                <legend>Tool:</legend>
                <div class="vspace">
                    <span>Mode:&nbsp;</span>
                    <button style={mode === 'map' && 'background: #ddd'}    on:click={() => mode = 'map'}>Map</button>
                    <button style={mode === 'mask' && 'background: #ddd'}   on:click={() => mode = 'mask'}>Mask</button>
                    <button style={mode === 'tokens' && 'background: #ddd'} on:click={() => mode = 'tokens'}>Token</button>
                </div>

                {#if ['map', 'mask'].includes(mode)}
                    <div class="vspace">
                        <span>Tool:&nbsp;</span>
                        <button style={tool.type === 'pen' && 'background: #ddd'}         on:click={() => tool.type = 'pen'}>Pen</button>
                        <button style={tool.type === 'line' && 'background: #ddd'}        on:click={() => tool.type = 'line'}>Line</button>
                        <button style={tool.type === 'rect' && 'background: #ddd'}        on:click={() => tool.type = 'rect'}>Rect</button>
                        <button style={tool.type === 'filled-rect' && 'background: #ddd'} on:click={() => tool.type = 'filled-rect'}>F. Rect</button>
                    </div>
                {/if}

                {#if mode === 'map'}
                    <div class="vspace">
                        <span>Mtl.:&nbsp;</span>
                        {#each TILE_TYPES as tile }
                            <button style={tool.mat === tile.value && 'background: #ddd'} on:click={() => tool.mat = tile.value}>{tile.name}</button>&nbsp;
                        {/each}
                    </div>
                {/if}

                {#if mode === 'tokens' && selectedToken}
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
            </fieldset>

            <fieldset>
                <legend>Display</legend>

                <div class="row vspace">
                    <button class:selected={displayOptions.mask} on:click={() => displayOptions.mask = !displayOptions.mask}>Show Mask</button>
                    &nbsp;
                    <button class:selected={displayOptions.gmTokens} on:click={() => displayOptions.gmTokens = !displayOptions.gmTokens}>Show GM Tokens</button>
                </div>
                <div class="row vspace">
                    <button on:click={() => zoom *= 1.2}>Zoom In</button>
                    &nbsp;
                    <button on:click={() => zoom /= 1.2}>Zoom Out</button>
                </div>
                <div class="row vspace">
                    Player Link:
                    <input
                        type="text"
                        readonly
                        value={`${window.location.origin}/player/${page.params.sessionId}`}
                    />
                </div>

            </fieldset>
        </div>
    </div>
{/if}
