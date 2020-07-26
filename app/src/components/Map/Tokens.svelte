<style>
    image {
        image-rendering: crisp-edges;
        image-rendering: -moz-crisp-edges;
    }
</style>
<script>
    import { getImageURL } from '../../util.js';

    export let tokens;
    export let onmousedown = () => {};
</script>


{#each tokens as token}
    {#if token}
        <image
            x={token.x} y={token.y}
            width={token.scale}
            height={token.scale}
            href={getImageURL(token.url, 200)}
            clip-path="url(#clip-avatar)"
            on:mousedown={e => onmousedown(e, token)}
            {...$$restProps}
        />
    {/if}
{/each}
