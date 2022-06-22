import { WebSocketServer, WebSocket } from 'ws';
import process from 'process';
import { log, LoggerLevel } from '../logger';
import { getAllFoundLamps, getLamp, lampsEventEmitter } from '../lamps-cache';
import {
	isWebsocketMessage,
	isWebsocketMessageCallLampMethod,
	isWebsocketMessageRequestAllLamps,
	WebsocketMessageLampState,
} from './message';
import { translateLampId } from '../lib/translate-lamp-id';

const port = Number(process.env['WEBSOCKET_PORT']) || 3057;

const server = new WebSocketServer({ port });

function makeHeartbeatChecker(ws: WebSocket, ip: string) {
	let isAlive = true;
	let intervalHandler = setInterval(() => {
		if (!isAlive) {
			ws.close();
			clearInterval(intervalHandler);
			log(`Connection to ${ip} timed out`, LoggerLevel.MINIMAL);
			return;
		}
		isAlive = false;
		ws.ping();
	}, 30000);

	ws.on('ping', () => (isAlive = true));
	ws.on('pong', () => (isAlive = true));
	ws.on('message', () => (isAlive = true));
	ws.on('close', () => clearInterval(intervalHandler));
}

function parseData(data: string) {
	try {
		const dataJson = JSON.parse(data);
		if (isWebsocketMessage(dataJson)) return dataJson;
		return null;
	} catch (e) {
		console.error('Failed to parse JSON data:', data);
		return null;
	}
}

server.on('connection', (ws, req) => {
	const ip = req.headers['x-real-ip'] as string;
	log(
		`WebSocket connection started from ${ip}. There are now ${server.clients.size} connections`,
		LoggerLevel.COMPLETE,
	);

	ws.on('close', () => {
		log(
			`Websocket connection with ${ip} closed. There are now ${server.clients.size} connections`,
			LoggerLevel.COMPLETE,
		);
	});

	ws.on('message', data => {
		const message = data.toString('utf8');
		const parsedMessage = parseData(message);
		if (!parsedMessage) return;
		if (isWebsocketMessageRequestAllLamps(parsedMessage)) {
			const allLamps = getAllFoundLamps();
			allLamps.forEach(lamp => {
				const message: WebsocketMessageLampState = { data: lamp.state, type: 'new-lamp-state' };
				ws.send(JSON.stringify(message));
			});
		} else if (isWebsocketMessageCallLampMethod(parsedMessage)) {
			const method = parsedMessage.data.method;
			const params = parsedMessage.data.args;
			const targets = parsedMessage.data.targets;
			log(
				`Received raw method "${method}" with params "${params}" for targets "${targets.map(
					translateLampId,
				)}" on websocket`,
				LoggerLevel.DEBUG,
			);

			targets.map(async targetId => {
				const lamp = getLamp(targetId);
				if (!lamp) throw new Error(`Could not find lamp ${targetId}`);
				await lamp.createAndSendMessage({ method, params });
				return { id: lamp.id, state: lamp.state };
			});
		} else {
			console.error(`Websocket received unknown mesage type:`, message);
		}
	});

	lampsEventEmitter.on('NEW_LAMP', lampState => {
		const message: WebsocketMessageLampState = { data: lampState, type: 'new-lamp-state' };
		log(`Emitting lamp ${translateLampId(lampState.id)} state to ${ip}`, LoggerLevel.DEBUG);
		ws.send(JSON.stringify(message));
	});

	makeHeartbeatChecker(ws, ip!);
});

server.on('listening', () => {
	log(`Listening for Websocket connections on port ${port}`, LoggerLevel.MINIMAL);
});
