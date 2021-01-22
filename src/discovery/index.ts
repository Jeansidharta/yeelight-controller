import dgram from 'dgram';
import { addOrUpdateLamp } from '../lamp/lamps-cache';
import { parseMessage } from './parse-message';

const DISCOVERY_MESSAGE = (
	'M-SEARCH * HTTP/1.1' + '\r\n' +
	'MAN: "ssdp:discover"' + '\r\n' +
	'ST: wifi_bulb'
);

const DISCOVERY_ADDRESS = '239.255.255.250';
const DISCOVERY_SOCKET_SOURCE_PORT = 55555;
const DISCOVERY_PORT = 1982;

const MULTICAST_TTL = 4;

let discoverySocket: dgram.Socket | null = null;

async function handleSocketMessage (data: Buffer) {
	const message = data.toString('utf8');
	const lamp = parseMessage(message);
	if (!lamp) return;
	addOrUpdateLamp(lamp);
}

async function createDiscoverySocket () {
	discoverySocket = dgram.createSocket('udp4');

	discoverySocket.bind(DISCOVERY_SOCKET_SOURCE_PORT);

	await new Promise<void>(resolve => {
		discoverySocket!.once('listening', () => {
			discoverySocket!.addMembership(DISCOVERY_ADDRESS);
			discoverySocket!.setMulticastTTL(MULTICAST_TTL);
			resolve();
		});
	});

	discoverySocket!.on('message', handleSocketMessage);

	return discoverySocket;
}

async function createNotifySocket () {
	const notifySocket = dgram.createSocket('udp4');

	await new Promise<void>(resolve => {
		notifySocket.bind(DISCOVERY_PORT, resolve);
	});

	console.log(`Listening for notify messages on port ${DISCOVERY_PORT}`);
	notifySocket.on('message', handleSocketMessage);

	return notifySocket;
}

export async function sendDiscoveryMessage () {
	if (!discoverySocket) await createDiscoverySocket();
	console.log('Sending discovery message.');

	return new Promise<number>((resolve, reject) => {
		discoverySocket!.send(DISCOVERY_MESSAGE, DISCOVERY_PORT, DISCOVERY_ADDRESS, (error, bytesSent) => {
			if (error) reject(error);
			else resolve(bytesSent);
		});
	});
}

createNotifySocket();