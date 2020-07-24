<style>
    label {
        background: white;
        border: 1px solid #333;
        font-size: 1.2rem;
        padding: 0 8px;
    }
    label:hover {
        background: #eee;
    }
    label input {
        display: none;
    }
</style>

<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let uploading = false;
    let uploadCount = 0;
    let uploadDone = 0;
    async function handleUploadFiles (e) {
        uploading = true;
        uploadCount = e.target.files.length;
        uploadDone = 0;

        for (const f of e.target.files) {
            const body = new FormData();
            body.append('f', f);

            const uploadRes = await fetch(
                '/upload',
                { method: 'POST', body }
            )

            if (uploadRes.ok) {
                dispatch('upload', await uploadRes.json());
            }
            uploadCount += 1;
        }
        uploading =false;
    }
</script>

<label>
    <slot />
    <input type="file" on:change={handleUploadFiles} disabled={uploading} multiple />
    {#if uploading}
        Uploaded {uploadDone} / {uploadCount}
    {/if}
</label>
