<script>
    import { fade } from 'svelte/transition';

    export let pings;
    export let mapId;
</script>

{#each Object.entries(pings) as [key, val]}
    {#if val.mapId === mapId}
        <circle
            in:fade
            out:fade
            cx={val.x}
            cy={val.y}
            r={0.5}
            stroke="red"
            fill="transparent"
            vector-effect="non-scaling-stroke"
            stroke-width="2"
        >
            <animate attributeName="r" values="0.5;0.6;0.5" dur="0.5s" repeatCount="indefinite" />
        </circle>
    {/if}
{/each}
