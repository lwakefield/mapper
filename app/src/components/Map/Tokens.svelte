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
            height="auto"
            href={getImageURL(token.url, 200)}
            clip-path="url(#clip-avatar)"
            style="image-rendering: crisp-edges; image-rendering: -moz-crisp-edges;"
            on:mousedown={e => onmousedown(e, token)}
            {...$$restProps}
        />
    {/if}
{/each}
