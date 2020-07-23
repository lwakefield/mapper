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
</style>

<script context="module">
    export async function preload(page, session) {
        return { page };
    }
</script>

<script>
    import * as Game from '../../stores/game.js';
    import Map from '../../components/Map.svelte';
    import Tokens from '../../components/Map/Tokens.svelte';
    import FOW from '../../components/Map/FOW.svelte';
    import Chat from '../../components/Chat.svelte';
    import * as Tools from '../../tools.js';

    export let page;

    let session, maps;
    let map;
    let gmTokens = [];
    let playerTokens = [];
    let zoom = 1;

    if (process.browser) {
        Game.init(page.params.sessionId);
        Game.store.subscribe(state => {
            ({ session, maps } = state);

            if (session && maps[session.activeMapId]) {
                map = maps[session.activeMapId];
                playerTokens = Object.values(map.tokens)
                    .filter(v => v.layer === 'player');
                gmTokens = Object.values(map.tokens)
                    .filter(v => v.layer === 'gm');
            }
        });
    }

    let draggingToken = null;
    async function handleTokenMouseDown (ev, tok) {
        if (ev.button !== 0) return;
        if (tok.layer !== 'player') return;

        ev.stopPropagation();

        draggingToken = tok;

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
</script>

{#if map}
    <div class="row" style="overflow: hidden">
        <div class="tabletop">
            <Map grid={map.grid} zoom={zoom}>
                <g slot="fogOfWar">
                    <FOW mask={map.mask} fill="#000" />
                </g>

                <Tokens
                    tokens={playerTokens}
                    onmousedown={handleTokenMouseDown}
                    style="cursor: move"
                />
                <Tokens tokens={gmTokens} />
                {#if draggingToken}
                    <Tokens tokens={[draggingToken]} />
                {/if}
            </Map>
        </div>
        <div class="sidebar col">
            <fieldset class="col hide-overflow">
                <legend>Display</legend>

                <div class="vspace">
                    <button on:click={() => zoom *= 1.2}>Zoom In</button>
                    <button on:click={() => zoom /= 1.2}>Zoom Out</button>
                </div>
            </fieldset>

            <fieldset class="col hide-overflow">
                <legend>Chat</legend>
                <Chat />
            </fieldset>
        </div>
    </div>
{/if}
