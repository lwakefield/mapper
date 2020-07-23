import SocketIO from 'socket.io-client';
import { writable, get } from 'svelte/store';

export const store = writable({ session: null, maps: {}, messages: [] });

function syncSession (session) {
    store.update(state => Object({ ...state, session }));
}
function syncMap (map) {
    store.update(state => Object({
        ...state,
        maps: {
            ...state.maps,
            [map.id]: map
        }
    }));
}
function initMessages (messages) {
    store.update(state => {
        return { ...state, messages, };
    });
}
function syncMessage (message) {
    store.update(state => {
        const newMessages = [ ...state.messages, message ];
        return {
            ...state,
            messages: newMessages,
        };
    });
}

let socket = null;
export function init (sessionId) {
    socket = SocketIO(`/${sessionId}`);
    socket.on('initialize:session',  syncSession);
    socket.on('update:session',      syncSession);
    socket.on('initialize:map',      syncMap);
    socket.on('update:map',          syncMap);
    socket.on('initialize:messages', initMessages);
    socket.on('update:message',      syncMessage);
    socket.connect();
}

export function updateSession (payload) {
    const { session } = get(store);
    return new Promise((resolve, reject) => {
        socket.emit('update:session', {
            id: session.id, ...payload
        }, (res) => {
            resolve();
        });
    })
}

export function updateActiveMap (payload) {
    const { session } = get(store);
    return new Promise((resolve, reject) => {
        socket.emit('update:map', {
            id: session.activeMapId, ...payload
        }, (res) => {
            resolve();
        });
    })
}

export function insertMap (payload) {
    return new Promise((resolve, reject) => {
        socket.emit('insert:map', payload, (res) => {
            resolve();
        });
    })
}

export function insertMessage (payload) {
    return new Promise((resolve, reject) => {
        socket.emit('insert:message', payload, (res) => {
            resolve();
        });
    })
}
