<style>
</style>

<script>
    import * as uuid from 'uuid';

    function handleNewGameClick (e) {
        const id = uuid.v4();
        window.location = `/v2/${id}`;
    }
</script>

<div>
    <button on:click={handleNewGameClick}>New Game</button>
</div>
