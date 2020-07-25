<style>
    img {
        object-fit: cover;
    }
    .tokenName:not(:hover):not(:active):not(:focus) {
        border: none;
    }
    .tokenList {
        overflow-y: scroll;
        max-height: 300px;
    }
</style>

<script>
    import * as Game from '../stores/game.js';
    import Upload from './Upload.svelte';

    let session;
    let searchNeedle = '';
    if (process.browser) {
        Game.store.subscribe(state => {
            ({ session } = state);
        });
    }

    async function handleAddToken (ev) {
        const token = {
            id: uuid.v4(),
            name: '',
            url: ev.detail.url,
        }
        await Game.updateSession({
            tokenLibrary: { [token.id]: token },
        });
    }

    function handleTokenDragStart (ev) {
        ev.dataTransfer.setData('tokenURL', this.url);
        ev.dataTransfer.dropEffect = 'copy';
    }

    async function handleTokenNameChange (e) {
        await Game.updateSession({ tokenLibrary: { [this.id]: { name: e.target.value } } });
    }
</script>

<div>
    <input
        type="text"
        placeholder="Search..."
        bind:value={searchNeedle}
        class="vspace"
    />

    <div class="tokenList">
        {#each Object.values(session.tokenLibrary || {}) as token}
            {#if token.name.toLowerCase().includes(searchNeedle.toLowerCase().trim())}
                <div class="row">
                    <img
                        width="40"
                        height="40"
                        src={token.url}
                        draggable=true
                        on:dragstart={handleTokenDragStart.bind(token)}
                        />&nbsp;
                        <input
                            type="text"
                            class="tokenName"
                            value={token.name}
                            placeholder="Token Name"
                            on:change={handleTokenNameChange.bind(token)}
                            />
                </div>
            {/if}
        {/each}
    </div>

    <div>
        <Upload on:upload={handleAddToken}>
            Add Tokens
        </Upload>
    </div>
</div>
