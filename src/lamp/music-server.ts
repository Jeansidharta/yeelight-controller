import net from 'net';
import os from 'os';

const MUSIC_SERVER_PORT = 54321;

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

function findMyIp () {
	const interfaces = os.networkInterfaces();
	for (const [interfaceName, interfaceInfo] of Object.entries(interfaces)) {
		if (!interfaceInfo) continue;
		if (interfaceName === 'lo') continue;
		for (const info of interfaceInfo) {
			if (info.internal) continue;
			if (info.family !== 'IPv4') continue;
			return info.address;
		}
	}

	return;
}

export class MusicServer {
	server: net.Server | null;
	connections: net.Socket[];

	ip: string;
	lampIp: string;
	port: number;

	private constructor (ip: string, lampIp: string) {
		this.server = null;
		this.connections = [];

		this.ip = ip;
		this.lampIp = lampIp;
		this.port = MUSIC_SERVER_PORT;
	}

	destroy () {
		this.server = null;
		this.connections.forEach(connection => connection.destroy());
		this.connections = [];
	}

	static async create (lampIp: string) {
		const myIp = findMyIp();
		if (!myIp) throw new Error('Failed to find my IP');
		const musicServer = new MusicServer(myIp, lampIp);

		// Creates the server itself.
		const server = net.createServer();
		await new Promise<void> (resolve => {
			server.listen(MUSIC_SERVER_PORT, () => {
				console.log(`listening for music on port ${MUSIC_SERVER_PORT}`);
				resolve();
			});
		});

		musicServer.server = server;

		// Connection handler
		server.on('connection', (clientSocket) => {
			musicServer.connections.push(clientSocket);

			clientSocket.on('close', () => {
				const index = musicServer.connections.findIndex(connection => connection === clientSocket);
				if (index !== -1) musicServer.connections.splice(index, 1);
				clientSocket.destroy();
			});
		});

		return musicServer;
	}

	async waitForAtLeastOneConnection () {
		while (this.connections.length === 0) await sleep(100);
	}

	sendMessage (...messages: string[]) {
		if (!this.server) throw new Error('You must have an active server to send a message.');

		this.connections.forEach(connection => {
			messages.forEach(message => connection.write(message));
		});
	}
}