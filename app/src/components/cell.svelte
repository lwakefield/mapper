<script>
    import { TILE_TYPES, TILE_MAP } from '../tiles.js';

    export let handleMouseDown = () => {};
    export let x, y, val = null;
    let props;
    $: if (TILE_MAP[val]) {
        props = { fill: 'url(#' + TILE_MAP[val].id + ')' }
    } else if (val === ' ') {
        props = {fill: '#fff', stroke: '#eee'};
    } else {
        props = {fill: 'purple', stroke: '#eee'}
    }
</script>

<rect
    x={x} y={y}
    width={1} height={1}
    {...props}
    vector-effect="non-scaling-stroke"
    stroke-width="1px"
    shape-rendering="crispEdges"
/>
