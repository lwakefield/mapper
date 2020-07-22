<script>
    import { TILE_TYPES } from '../tiles.js';

    export let handleMouseDown = () => {};
    export let x, y, val = null;
    let props;
    $: props = (val === ' ' && {fill: '#fff', stroke: '#eee'})
        || (val === '#' && {href: 'tiles/brick-000.png'})
        || (val === '.' && {href: 'tiles/cobblestone-000.png'})
        || (val === 'w' && {href: 'tiles/water-000.png'})
        || (val === '@' && {href: 'tiles/dirt-000.png'})
        || (val === '"' && {href: 'tiles/grass-000.png'})
        || {fill: 'purple'}
    ;
</script>

{#if props.href}
<image
    on:mousedown={handleMouseDown}
    x={x} y={y}
    width=1 height=1
    {...props}
    style="image-rendering: -moz-crisp-edges; image-rendering: pixelated;"
/>
{:else}
    <rect
        x={x} y={y}
        width={1} height={1}
        {...props}
        vector-effect="non-scaling-stroke"
        stroke-width="1px"
        stroke="#eee"
    />
{/if}
