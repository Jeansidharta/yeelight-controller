import net from 'net';
import os from 'os';

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

/**
 * Finds a valid IP address.
 */
function findMyIp() {
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

async function createServerOnRandomPort() {
	async function tryToBindToPort(port: number) {
		const server = net.createServer();
		return new Promise<net.Server | null>(resolve => {
			try {
				server.listen(port, () => {
					resolve(server);
				});
			} catch (e) {
				resolve(null);
			}
		});
	}

	function generateRandomPort() {
		const MAX_PORT = 65000;
		const MIN_PORT = 1024;
		return Math.floor(Math.random() * (MAX_PORT - MIN_PORT) + MIN_PORT);
	}

	for (let i = 0; i < 10; i++) {
		const randomPort = generateRandomPort();
		const server = await tryToBindToPort(randomPort);
		if (server) return [server, randomPort] as const;
	}

	return null;
}

/**
 * This class is responsible for initializing and managing music servers.
 */
export class MusicServer {
	server: net.Server | null;
	connections: net.Socket[];

	ip: string;
	lampIp: string;
	port: number;

	private constructor(ip: string, myPort: number, lampIp: string) {
		this.server = null;
		this.connections = [];

		this.ip = ip;
		this.lampIp = lampIp;
		this.port = myPort;
	}

	/**
	 * Kills, destroy and delete everything about the server.
	 */
	destroy() {
		this.server = null;
		this.connections.forEach(connection => connection.destroy());
		this.connections = [];
	}

	/**
	 * The main "constructor" for this class. It initializes a TCP server,
	 * and attachest connection handlers to it.
	 */
	static async create(lampIp: string) {
		const myIp = findMyIp();
		if (!myIp) throw new Error('Failed to find my IP');

		const serverResult = await createServerOnRandomPort();
		if (!serverResult) {
			throw new Error('Failed to find unused port for music server.');
		}

		const [server, myPort] = serverResult;
		const musicServer = new MusicServer(myIp, myPort, lampIp);
		musicServer.server = server;

		// Connection handler
		server.on('connection', clientSocket => {
			musicServer.connections.push(clientSocket);

			clientSocket.on('close', () => {
				const index = musicServer.connections.findIndex(connection => connection === clientSocket);
				if (index !== -1) musicServer.connections.splice(index, 1);
				clientSocket.destroy();
			});
		});

		return musicServer;
	}

	/**
	 * Returns a promise that will only be resolved when at least one lamp has connected.
	 */
	async waitForAtLeastOneConnection() {
		while (this.connections.length === 0) await sleep(100);
	}

	/**
	 * Sends a message throught the server to all connected clients.
	 */
	sendMessage(...messages: string[]) {
		if (!this.server) throw new Error('You must have an active server to send a message.');
		this.connections.forEach(connection => {
			messages.forEach(message => connection.write(message));
		});
	}
}
