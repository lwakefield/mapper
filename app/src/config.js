import { stores } from '@sapper/app';
import { get } from 'svelte/store';

export function getImageProxyHost() {
    const { session } = stores();
    const { IMAGE_PROXY_HOST } = get(session);
    return IMAGE_PROXY_HOST;
}
