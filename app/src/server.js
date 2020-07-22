import http from 'http';

import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import * as SocketIO from 'socket.io';

import { ws } from './ws.js';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const server = http.createServer();

polka({ server }) // You can also use Express
	.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		sapper.middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});

ws(server);
