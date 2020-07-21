<script>
    export let handleMouseDown = () => {};
    export let x, y, val = null;
    let props;
    $: props = (val === 0 && {fill: '#fff', stroke: '#eee'})
        || (val === 1 && {fill: 'url(#hatch)'})
        || (val === 2 && {fill: 'url(#stripe)'})
        || (val === 3 && {fill: '#6960EC'})
        || (val === 4 && {fill: '#835C3B'})
        || (val === 5 && {fill: '#4CC417'})
        || { fill: 'purple' };
</script>

<rect
    x={x} y={y}
    width={1} height={1}
    on:mousedown={handleMouseDown}
    {...props}
    vector-effect="non-scaling-stroke"
    stroke-width="1px"
/>
