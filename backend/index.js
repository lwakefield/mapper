const { performance } = require('perf_hooks');

const io = require('socket.io')();
const r = require('rethinkdb');
const uuid = require('uuid');

const Lib = require('@mapper/lib');

const UUID_RGX = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}/

let conn;

io.of(UUID_RGX).on('connection', async socket => {
    const { nsp } = socket;
    const id = nsp.name.replace(/^\//, '');

    console.log(`New connection on ${id}`);

    const table = r.table('sessions');

    let session = await r.table('sessions').get(id).run(conn);
    if (session) {
        let maps = await r.table('maps').filter({ sessionId: id }).run(conn);
        socket.emit('initialize:session', session);
        maps.each((err, map) => {
            socket.emit('initialize:map', map);
        });
    } else {
        session = Lib.makeWorld(id);
        const map = Lib.makeMap(session.id);
        session.activeMapId = map.id;

        await r.table('sessions').insert(session).run(conn);
        await r.table('maps').insert(map).run(conn);

        console.log(`Initialized session:${id}`);
        socket.emit('initialize:session', session);
        socket.emit('initialize:map',     map);
    }


    r.table('maps').filter({ sessionId: id }).changes().run(conn, (err, cursor) => {
        cursor.each((err, row) => {
            !err && socket.emit('update:map', row.new_val);
        });
    });

    r.table('sessions').get(id).changes().run(conn, (err, cursor) => {
        cursor.each((err, row) => {
            !err && socket.emit('update:sessions', row.new_val);
        });
    });

    for (const table of ['maps', 'sessions']) {
        const singular = table.replace(/s$/, '');

        socket.on(`update:${singular}`, (data, callback) => {
            let startUpdate = performance.now();
            // TODO: DANGER accepting arbitrary id
            const { id, ...payload } = data;
            r.table(table).get(id).update(payload).run(conn, (err, res) => {
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
        r.table('maps').insert(data).run(conn, (err, res) => {
            (res.inserted === 1) && console.log(`Inserted map:${data.id} in ${performance.now() - startUpdate}ms`);
            (res.inserted === 0) && console.error(`Did not insert map:${data.id} in ${performance.now() - startUpdate}ms`, err);

            if (callback) {
                (res.inserted === 0 || err) && callback('error');
                (res.inserted === 1 && !err) && callback('ok');
            }
        });
    });

});

async function main () {
    conn = await r.connect({ host: process.env.RETHINK_HOST, port: process.env.RETHINK_PORT });
    try {
        await r.tableCreate('sessions').run(conn);
    } catch (e) { /* happens if table already exists */ }
    try {
        await r.tableCreate('maps').run(conn);
        await r.table('maps').indexCreate('sessionId').run(conn);
    } catch (e) { /* happens if table already exists */ }
    console.log('listening...');
    io.listen(3001);
}

main();
