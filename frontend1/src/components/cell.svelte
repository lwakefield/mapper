<script>
    import { beforeUpdate } from 'svelte';

    export let handleMouseDown = () => {};
    export let x, y, val = null;
    let fill;
    $: fill = (val === 0 && '#fff')
        || (val === 1 && '#333')
        || (val === 2 && '#999')
        || (val === 3 && '#6960EC')
        || (val === 4 && '#835C3B')
        || (val === 5 && '#4CC417')
        || 'purple';
</script>

<rect
    x={x} y={y}
    width={1} height={1}
    on:mousedown={handleMouseDown}
    fill={fill}
    vector-effect="non-scaling-stroke"
    stroke="#eee"
    stroke-width="1px"
/>
