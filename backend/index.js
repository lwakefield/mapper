const io = require('socket.io')();
const r = require('rethinkdb');
const uuid = require('uuid');

const UUID_RGX = /([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}){1}/

let conn;

function newWorld (id) {
    return {
        id,
        maps: {
            [uuid.v4()]: {
                transform: { x: 0, y: 0, scale: 1 },
                map: {
                    size: { width: 64, height: 64 },
                    grid: (new Array(64 * 64)).fill(0)
                },
                gmTokens: {}
            }
        }
    }
}

io.of(UUID_RGX).on('connection', socket => {
    const { nsp } = socket;
    const id = nsp.name.replace(/^\//, '');

    console.log(`New connection on ${id}`);

    const table = r.table('sessions');

    table.get(id).run(conn, (err, row) => {
        if (err) {
            console.error(err);
        } else if (row) {
            socket.emit('initialize', row);
        } else {
            const world = newWorld(id);
            table.insert(world).run(conn, (err, res) => {
                if (err) {
                    console.error(`Error initialized ${id}`);
                    console.error(err);
                } else {
                    console.log(`Initialized ${id}`);
                    socket.emit('initialize', world);
                }
            });
        }
    });

    table.get(id).changes().run(conn, (err, cursor) => {
        cursor.each((err, row) => {
            !err && socket.emit('update', row.new_val);
        });
    });

    socket.on('update', (data, callback) => {
        // const { revision, ...payload } = data;
        // const newRevision = uuid.v4();
        table.filter({ id }).update(data).run(conn, (err, res) => {
            (res.replaced === 1) && console.log(`Updated ${id}`);
            (res.replaced === 0) && console.error(`Did not update ${id}`, err);

            if (callback) {
                (res.replaced === 0 || err) && callback('error');
                (res.replaced === 1 && !err) && callback('ok');
            }
        });
    });
});

async function main () {
    conn = await r.connect({ host: process.env.RETHINK_HOST, port: process.env.RETHINK_PORT });
    console.log('listening...');
    io.listen(3001);
}

main();
