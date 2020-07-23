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
    <Map grid={map.grid} zoom={1}>
        <g slot="fogOfWar">
            <FOW mask={map.mask} fill="#000" />
        </g>

        <Tokens tokens={map.gmTokens} />
    </Map>
{/if}
