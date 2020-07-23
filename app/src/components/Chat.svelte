<style>
    .messages {
        overflow-y: scroll;
    }
    .messages * {
        overflow-anchor: none;
    }
    .messages .anchor {
        overflow-anchor: auto;
        height: 1px;
    }
</style>

<script>
    import * as Game from '../stores/game.js';
    import { makeMessage } from '../factory.js';

    let session, messages = [];
    let from = 'anon';
    if (process.browser) {
        Game.store.subscribe(state => {
            messages = state.messages;
            session = state.session;
        });
    }

    async function handleSendMessage (e) {
        if (e.key !== 'Enter') return;

        e.preventDefault();

        const { value } = e.target;

        await Game.insertMessage(makeMessage(session.id, from, value));

        e.target.value = '';
    }
</script>

<div class="col hide-overflow">
    <div class="messages col">
        {#each messages as message}
            <div>
                <span>{message.from}</span> - <span>{message.message}</span>
            </div>
        {/each}
        <div class="anchor">&nbsp;</div>
    </div>
    <div>
        <label>From:&nbsp;
            <input type="text" bind:value={from} />
        </label>
        <textarea
            style="width: 100%;"
            on:keydown={handleSendMessage}
        />
    </div>
</div>
