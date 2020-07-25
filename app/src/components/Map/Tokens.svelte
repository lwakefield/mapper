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
            href={process.env.IMAGE_PROXY_HOST}/200/{token.url}
            clip-path="url(#clip-avatar)"
            on:mousedown={e => onmousedown(e, token)}
            {...$$restProps}
        />
    {/if}
{/each}
