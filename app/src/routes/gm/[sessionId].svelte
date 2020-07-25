<style>
    .tabletop {
        overflow: scroll;
        padding-right: 10px;
        padding-bottom: 10px;
        flex-basis: 0;
        flex-grow: 1;
    }
    .sidebar {
        width: 350px;
        padding: 10px;
        overflow-y: scroll;
    }
    .selected {
        background: #ddd;
    }
    .collapse :not(legend) {
        display: none;
    }
</style>

<script context="module">
    export async function preload(page, session) {
        return { page };
    }
</script>

<script>
    import * as uuid from 'uuid';

    import Cell from '../../components/Cell.svelte';
    import Map from '../../components/Map.svelte';
    import FOW from '../../components/Map/FOW.svelte';
    import Tokens from '../../components/Map/Tokens.svelte';
    import Chat from '../../components/Chat.svelte';
    import TokenLibrary from '../../components/TokenLibrary.svelte';
    import Collapsible from '../../components/Collapsible.svelte';

    import * as Game from '../../stores/game.js';

    import * as Util from '../../util.js';
    import * as Tools from '../../tools.js';
    import { makeMap, makeToken } from '../../factory.js';
    import { TILE_TYPES } from '../../tiles.js';
    import { getImageProxyHost } from '../../config.js';

    export let page;

    // vars from store
    let session, maps;

    // calculated vars
    let map = null;
    let gmTokens = [];
    let playerTokens = [];
    let mapSize = null;

    let mode = 'map';
    let zoom = 1.0;
    let selectedToken = null;
    let draggingToken = null;
    let tool = { type: 'pen', mode: 'draw', mat: '#', temp: null };
    let mods = { shift: false };
    let displayOptions = {
        mask: true,
        gmTokens: true,
        playerTokens: true,
    };

    if (process.browser) {
        Game.init(page.params.sessionId);
        Game.store.subscribe(state => {
            ({ session, maps } = state);

            if (session && maps[session.activeMapId]) {
                map = maps[session.activeMapId];
                let rows = map.grid.split('\n');
                mapSize = { width: rows[0].length, height: rows.length };
                playerTokens = Object.values(map.tokens)
                    .filter(v => v.layer === 'player');
                gmTokens = Object.values(map.tokens)
                    .filter(v => v.layer === 'gm');
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
        if (draggingToken) return;

        if (['map', 'mask'].includes(mode)) {
            return handleMapMaskToolMouseDown(ev);
        }
    }

    async function handleTokenMouseDown (ev, tok) {
        if (ev.button !== 0) return;

        ev.stopPropagation();

        if (mode !== 'token') mode = 'tokens';

        selectedToken = map.tokens[tok.id];


        if (ev.shiftKey) {
            /* socket.emit('update:map', { */
            /*     id: map.id: { gmTokens: { [tokenId]: null } } */
            /* }, (res) => {}); */
        } else {
            if (ev.altKey) {
                const token = JSON.parse(JSON.stringify(tok));
                token.id = uuid.v4();
                map.tokens[token.id] = token;
                selectedToken = token;
                map = { ...map };
            }

            draggingToken = selectedToken;

            const update = ({ dx, dy }) => {
                draggingToken.x += dx;
                draggingToken.y += dy;
            };
            const commit = async ({ dx, dy }) => {
                draggingToken.x += dx;
                draggingToken.y += dy;

                await Game.updateActiveMap({ tokens: { [draggingToken.id]: draggingToken } });
                draggingToken = null;
            }
            Tools.movetool(ev, update, commit);
        }
    }

    async function handleSyncActiveToken () {
        await Game.updateActiveMap({ tokens: { [selectedToken.id]: selectedToken } });
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

    async function handleAddTokenToMap (ev) {
        ev.preventDefault();
        const token = {
            ...makeToken('gm'),
            ...Tools.toQuantizedSVGPoint(ev),
            url: ev.dataTransfer.getData('tokenURL')
        };
        await Game.updateActiveMap({ tokens: { [token.id]: token } });
    }

    function handleMapDragOver (ev) {
        if (ev.dataTransfer.getData('tokenURL')) {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = 'copy';
        }
    }
</script>

{#if map}
    <div class="row" style="overflow: hidden">
        <div class="tabletop">
            <Map
                grid={map.grid} zoom={zoom}
                on:mousedown={handleGridToolMouseDown}
                on:drop={handleAddTokenToMap}
                on:dragover={handleMapDragOver}
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
                        tokens={gmTokens}
                        onmousedown={handleTokenMouseDown}
                        style={`cursor: ${
                            (mods.shift && 'not-allowed')
                            || (mods.alt && 'copy')
                            || 'move'
                        }`}
                    />
                {/if}

                {#if displayOptions.playerTokens}
                    <Tokens
                        tokens={playerTokens}
                        onmousedown={handleTokenMouseDown}
                        style={`cursor: ${
                            (mods.shift && 'not-allowed')
                            || (mods.alt && 'copy')
                            || 'move'
                        }`}
                    />
                {/if}

                {#if draggingToken}
                    <Tokens tokens={[draggingToken]} />
                {/if}

            </Map>
        </div>

        <div class="sidebar col">
            <Collapsible title="Map">
                <div class="vspace" style="max-height: 200px; width: 100%; overflow-y: scroll;">
                    {#each Object.entries(maps || {}) as [ id, m ]}
                        <div class:selected={session.activeMapId === id} style="display: flex; justify-content: space-between;">
                            <div
                                style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis; width: 150px;"
                                on:click={e => Game.updateSession({ activeMapId: id }) }
                            >{m.name}</div>

                            <button on:click={e => handleCloneMap(m)}>Clone</button>
                        </div>
                    {/each}

                </div>

                <div class="vspace">
                    <button on:click={handleNewMap}>New Map</button>
                </div>

                <label>
                    Map Name:
                    <input
                        type="text"
                        value={map.name}
                        on:blur={e => Game.updateActiveMap({ name: e.target.value })}
                    />
                </label>
            </Collapsible>

            <Collapsible title="Tool">
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

                {#if mode === 'tokens'}
                    <Collapsible title="Token Library">
                        <TokenLibrary />
                    </Collapsible>
                {/if}

                {#if mode === 'tokens' && selectedToken}
                    <Collapsible title="Selected Token">
                        <img src="{getImageProxyHost()}/200/{selectedToken.url}" style="width: 100%" />
                        <label>
                            URL:&nbsp;<input type="text" disabled bind:value={selectedToken.url} />
                        </label>
                        <label>
                            Layer:
                            <select bind:value={selectedToken.layer} on:blur={handleSyncActiveToken}>
                                <option value="gm">GM</option>
                                <option value="player">Player</option>
                            </select>
                        </label>
                        <label>
                            Scale:&nbsp;
                            <input
                                type="number" step="any"
                                bind:value={selectedToken.scale}
                                on:change={handleSyncActiveToken}
                            />
                        </label>
                        <label>
                            X:&nbsp;
                            <input
                                type="number" step="any"
                                bind:value={selectedToken.x}
                                on:change={handleSyncActiveToken}
                            />
                        </label>
                        <label>
                            Y:&nbsp;
                            <input
                                type="number" step="any"
                                bind:value={selectedToken.y}
                                on:change={handleSyncActiveToken}
                            />
                        </label>
                    </Collapsible>
                {/if}
            </Collapsible>

            <Collapsible title="Display">
                <div class="vspace">
                    <button class:selected={displayOptions.mask} on:click={() => displayOptions.mask = !displayOptions.mask}>Mask</button>
                    <button class:selected={displayOptions.gmTokens} on:click={() => displayOptions.gmTokens = !displayOptions.gmTokens}>GM Tokens</button>
                    <button class:selected={displayOptions.playerTokens} on:click={() => displayOptions.playerTokens = !displayOptions.playerTokens}>Player Tokens</button>
                </div>
                <div class="row vspace">
                    <button on:click={() => zoom *= 1.2}>Zoom In</button>
                    &nbsp;
                    <button on:click={() => zoom /= 1.2}>Zoom Out</button>
                </div>
                <div class="row vspace">
                    <input
                        type="text"
                        readonly
                        value={`${window.location.origin}/player/${page.params.sessionId}`}
                    />
                </div>

            </Collapsible>

            <Collapsible title="Chat" class="col">
                <Chat class="grow" />
            </Collapsible>
        </div>
    </div>
{/if}
