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

    export let page;

    let session, maps;
    let map;
    let zoom = 1;

    if (process.browser) {
        Game.init(page.params.sessionId);
        Game.store.subscribe(state => {
            ({ session, maps } = state);

            if (session && maps[session.activeMapId]) {
                map = maps[session.activeMapId];
            }
        });
    }
</script>

{#if map}
    <div class="row" style="overflow: hidden">
        <div class="tabletop">
            <Map grid={map.grid} zoom={zoom}>
                <g slot="fogOfWar">
                <FOW mask={map.mask} fill="#000" />
                </g>

                <Tokens tokens={Object.values(map.tokens)} />
            </Map>
        </div>
        <div class="sidebar">
            <div class="row vspace">
                <button on:click={() => zoom *= 1.2}>Zoom In</button>
                &nbsp;
                <button on:click={() => zoom /= 1.2}>Zoom Out</button>
            </div>
        </div>
    </div>
{/if}
