<script>
    import { beforeUpdate } from 'svelte';

    import { mkrand } from '../util.js';
    import { TILE_MAP } from '../tiles.js';
    import Cell from './Cell.svelte';

    export let grid;

    let rows = [];
    $: rows = grid.split('\n').map(row => row.split(''));

    let rand = mkrand();
    beforeUpdate(() => { rand = mkrand(); });

    function getFill (val) {
        let choice = rand();

        if (val === ' ') return { fill: '#fff', stroke: '#eee' };

        const tile = TILE_MAP[val];

        if (!tile) return { fill: 'red' };

        let variants = tile.variants;
        const sum = variants.reduce((a, c) => a + c[1], 0);
        choice = Math.floor(choice * sum);

        let acc = 0;
        for (let variant of variants) {
            if (acc < choice && (acc + variant[1]) >= choice) {
                return { fill: `url(#${variant[0]})` }
            }
            acc += variant[1];
        }

        return { fill: `url(#${tile.variants[0][0]})` }

    }
</script>

{#each rows as row, y}
    {#each row as val, x}
        <Cell x={x} y={y} {...getFill(val)} />
    {/each}
{/each}
