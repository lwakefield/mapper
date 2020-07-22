import { performance } from 'perf_hooks';

import * as SocketIO from 'socket.io';
import * as RethinkDB from 'rethinkdb';

import { makeWorld, makeMap } from './factory.js';

const UUID_RGX = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}/

let conn = null;

export const ws = async server => {
    conn = await RethinkDB.connect({
        host: process.env.RETHINK_HOST,
        port: process.env.RETHINK_PORT
    });

    try {
        await RethinkDB.tableCreate('sessions').run(conn);
    } catch (e) { /* happens if table already exists */ }
    try {
        await RethinkDB.tableCreate('maps').run(conn);
        await RethinkDB.table('maps').indexCreate('sessionId').run(conn);
    } catch (e) { /* happens if table already exists */ }

    SocketIO(server).of(UUID_RGX).on('connection', handleConnection);
};

export const handleConnection = async socket => {
    const { nsp } = socket;
    const id = nsp.name.replace(/^\//, '');

    console.log(`New connection on ${id}`);

    let session = await RethinkDB.table('sessions').get(id).run(conn);
    if (session) {
        let maps = await RethinkDB.table('maps').filter({ sessionId: id }).run(conn);
        socket.emit('initialize:session', session);
        maps.each((err, map) => {
            socket.emit('initialize:map', map);
        });
    } else {
        session = makeWorld(id);
        const map = makeMap(session.id);
        session.activeMapId = map.id;

        await RethinkDB.table('sessions').insert(session).run(conn);
        await RethinkDB.table('maps').insert(map).run(conn);

        console.log(`Initialized session:${id}`);
        socket.emit('initialize:session', session);
        socket.emit('initialize:map',     map);
    }


    RethinkDB.table('maps').filter({ sessionId: id }).changes().run(conn, (err, cursor) => {
        socket.on('disconnect', () => { cursor.close() });
        cursor.each((err, row) => {
            !err && socket.emit('update:map', row.new_val);
        });
    });

    RethinkDB.table('sessions').get(id).changes().run(conn, (err, cursor) => {
        socket.on('disconnect', () => cursor.close());
        cursor.each((err, row) => {
            !err && socket.emit('update:session', row.new_val);
        });
    });

    for (const table of ['maps', 'sessions']) {
        const singular = table.replace(/s$/, '');

        socket.on(`update:${singular}`, (data, callback) => {
            let startUpdate = performance.now();
            // TODO: DANGER accepting arbitrary id
            const { id, ...payload } = data;
            RethinkDB.table(table).get(id).update(payload, { durability: 'soft' }).run(conn, (err, res) => {
                (res.replaced === 1) && console.log(`Updated ${singular}:${id} in ${performance.now() - startUpdate}ms`);
                (res.replaced === 0) && console.error(`Did not update ${singular}:${id} in ${performance.now() - startUpdate}ms`, err);

                if (callback) {
                    (res.replaced === 0 || err) && callback('error');
                    (res.replaced === 1 && !err) && callback('ok');
                }
            });
        });
    }

    socket.on('insert:map', (data, callback) => {
        let startUpdate = performance.now();
        // TODO: DANGER accepting arbitrary id
        RethinkDB.table('maps').insert(data).run(conn, (err, res) => {
            (res.inserted === 1) && console.log(`Inserted map:${data.id} in ${performance.now() - startUpdate}ms`);
            (res.inserted === 0) && console.error(`Did not insert map:${data.id} in ${performance.now() - startUpdate}ms`, err);

            if (callback) {
                (res.inserted === 0 || err) && callback('error');
                (res.inserted === 1 && !err) && callback('ok');
            }
        });
    });
};
