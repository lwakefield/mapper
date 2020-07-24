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
    import { stores } from '@sapper/app';
    import * as uuid from 'uuid';

    import Cell from '../../components/Cell.svelte';
    import Map from '../../components/Map.svelte';
    import FOW from '../../components/Map/FOW.svelte';
    import Tokens from '../../components/Map/Tokens.svelte';
    import Chat from '../../components/Chat.svelte';
    import Upload from '../../components/Upload.svelte';

    import * as Game from '../../stores/game.js';

    import * as Util from '../../util.js';
    import * as Tools from '../../tools.js';
    import { makeMap, makeToken } from '../../factory.js';
    import { TILE_TYPES } from '../../tiles.js';

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
        } else if (mode === 'tokens') {
            if (ev.button !== 0) return;

            const token = { ...makeToken('gm'), ...Tools.toSVGPoint(ev) };

            await Game.updateActiveMap({ tokens: { [token.id]: token } });
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

    async function addToken (ev) {
        const token = {
            id: uuid.v4(),
            name: '',
            url: ev.detail.url,
        }
        await Game.updateSession({
            tokenLibrary: { [token.id]: token },
        });
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

                {#if mode === 'tokens'}
                    <div>
                        <div>
                            <Upload on:upload={addToken}>
                                Add Tokens
                            </Upload>
                        </div>

                        {#each Object.values(session.tokenLibrary) as token}
                            <img
                                width="40"
                                height="40"
                                style="object-fit: cover"
                                src={token.url}
                            />
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
                            Layer:
                            <select bind:value={selectedToken.layer} on:blur={handleSyncActiveToken}>
                                <option value="gm">GM</option>
                                <option value="player">Player</option>
                            </select>
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
                    Player Link:
                    <input
                        type="text"
                        readonly
                        value={`${window.location.origin}/player/${page.params.sessionId}`}
                    />
                </div>

            </fieldset>

            <fieldset class="col hide-overflow grow">
                <legend>Chat</legend>
                <Chat class="grow" />
            </fieldset>
        </div>
    </div>
{/if}
