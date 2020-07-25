<script>
    import { beforeUpdate } from 'svelte';

    import { mkrand } from '../util.js';
    import { TILE_MAP, TILE_TYPES } from '../tiles.js';
    import Cell from './Cell.svelte';

    export let grid;
    export let zoom;
    export let onmousedown = () => {};

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

<svg
    width={`${100 * zoom}%`}
    viewBox={`0 0 ${rows[0].length} ${rows.length}`}
    shape-rendering="crispEdges"
    on:mousedown
    on:drop
    on:dragover
>
    <rect x=0 y=0 width="100%" height="100%" fill="#333" />

    <defs>
        <clipPath id="clip-avatar" clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
        </clipPath>

        {#each TILE_TYPES as tile}
            {#each tile.variants as [id, _]}
                <pattern id={id} width=1 height=1 patternUnits="userSpaceOnUse" >
                    <image
                        width=1 height=1
                        href="tiles/{id}.png"
                        style="image-rendering: -moz-crisp-edges; image-rendering: pixelated;"
                    />
                </pattern>
            {/each}
        {/each}
    </defs>

    <mask id="fogOfWar">
        <slot name="fogOfWar">
            <rect x=0 y=0 width="100%" height="100%" fill="#fff" />
        </slot>
    </mask>

    <g mask="url(#fogOfWar)">
        {#each rows as row, y}
            {#each row as val, x}
                <Cell x={x} y={y} {...getFill(val)} />
            {/each}
        {/each}

        <slot />
    </g>
</svg>
