<script>
    export let tokens;
    export let onmousedown = () => {};
</script>


{#each Object.entries(tokens) as [ tokenId, token ]}
    {#if token}
        <image
            x={token.x} y={token.y}
            width={token.scale}
            height="auto"
            href={token.url}
            clip-path="url(#clip-avatar)"
            on:mousedown={e => onmousedown(e, tokenId, token)}
            {...$$restProps}
        />
    {/if}
{/each}
