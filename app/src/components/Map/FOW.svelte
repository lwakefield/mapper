<script>
    export let mask;
    export let fill;
</script>

{#each mask.split('\n') as row, y}
    {#each row.split('') as val, x}
        <rect
            x={x} y={y} width={1} height={1}
            fill={(val === ' ' && '#fff') || fill}
        />
    {/each}
{/each}
