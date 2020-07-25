import http from 'http';

import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import * as SocketIO from 'socket.io';
import upload from 'express-fileupload';

import { ws } from './ws.js';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const server = http.createServer();

polka({ server }) // You can also use Express
	.use(
		compression({ threshold: 0 }),
		upload({
			limits: { fileSize: 10 * 1024 * 1024 }, // 1MB
		}),
		sirv('static', { dev }),
		sapper.middleware({
			session: (req, res) => ({
				IMAGE_PROXY_HOST: process.env.IMAGE_PROXY_HOST
			})
		})
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});

ws(server);
