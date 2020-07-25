<style>
    .collapsed :global(:not(legend)) {
        display: none;
    }
    legend {
        cursor: pointer;
    }
</style>

<script>
    let collapsed = false;
    const toggle = () => collapsed = !collapsed;
    export let title;
</script>

<fieldset {...$$restProps} class:collapsed>
    <legend on:click={toggle}>
        {#if collapsed} [-] {/if}
        {title}
    </legend>
    <slot />
</fieldset>
