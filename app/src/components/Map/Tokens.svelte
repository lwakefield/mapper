<script>
    export let tokens;
    export let onmousedown = () => {};
</script>


{#each tokens as token}
    {#if token}
        <image
            x={token.x} y={token.y}
            width={token.scale}
            height="auto"
            href={token.url}
            clip-path="url(#clip-avatar)"
            on:mousedown={e => onmousedown(e, token.id, token)}
            {...$$restProps}
        />
    {/if}
{/each}
