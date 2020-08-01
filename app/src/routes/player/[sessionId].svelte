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

<svelte:head>
    <title>DnDandy - Player View</title>
</svelte:head>

<script>
    import { tick } from 'svelte';

    import * as Game from '../../stores/game.js';
    import Map from '../../components/Map.svelte';
    import Tokens from '../../components/Map/Tokens.svelte';
    import FOW from '../../components/Map/FOW.svelte';
    import Chat from '../../components/Chat.svelte';
    import Pings from '../../components/Map/Pings.svelte';
    import * as Tools from '../../tools.js';

    export let page;

    let session, maps, pings;
    let map;
    let gmTokens = [];
    let playerTokens = [];
    let zoom = 1;

    if (process.browser) {
        Game.init(page.params.sessionId);
        Game.store.subscribe(state => {
            ({ session, maps, pings } = state);

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

    async function handleMapWheel (ev) {
        if (ev.ctrlKey) {
            const target = ev.target;
            const left = target.scrollLeft / target.scrollLeftMax;
            const top = target.scrollTop / target.scrollTopMax;
            ev.preventDefault();
            zoom += event.deltaY * -0.001;
            await tick();
            target.scrollLeft = left * target.scrollLeftMax;
            target.scrollTop = top * target.scrollTopMax;
        }
    }

    async function handleDblClick (ev) {
        const point = Tools.toSVGPoint(ev);
        await Game.insertMapPing({
            mapId: session.activeMapId,
            ...point,
        });
    }
</script>

{#if map}
    <div class="row" style="overflow: hidden">
        <div class="tabletop" on:wheel={handleMapWheel}>
            <Map
                grid={map.grid}
                zoom={zoom}
                on:wheel={handleMapWheel}
                on:dblclick={handleDblClick}
            >
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

                <Pings pings={pings} mapId={session.activeMapId} />
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

            <fieldset class="col hide-overflow grow">
                <legend>Chat</legend>
                <Chat class="grow" filter={m => m.to === 'all'} />
            </fieldset>
        </div>
    </div>
{/if}
