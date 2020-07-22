<style>
    .menu {
        display: none;
        position: absolute;
        border: 1px solid #333;
        background: white;
    }

    .show {
        display: block !important;
    }
</style>

<script>
    import { onMount } from 'svelte';

    let show = false;
    let pos = {x:0, y:0};
    let menuEl = null;

    onMount(() => {
        menuEl.parentNode.addEventListener('contextmenu', e => {
            if (e.button !== 2) return;
            e.preventDefault();

            show = true;

            let parentBox = menuEl.parentNode.getBoundingClientRect();

            pos = { x: e.clientX - parentBox.x, y: e.clientY - parentBox.y };
            console.log(e);

            document.addEventListener('click', e => {
                show = false;
                e.stopPropagation();
            }, { once: true });
        });
    });
</script>

<div
    bind:this={menuEl}
    class="menu"
    class:show
    style="left: {pos.x}px; top: {pos.y}px;"
>
    <slot />
</div>
