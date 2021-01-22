import net from 'net';

export type LampResponse = {
	id: number,
	result: any[],
} | {
	id: number,
	error: {
		code: number,
		message: string,
	},
}

/**
 * This class is responsible for sending messages to a lamp.
 */
export class LampSender {
	connection: net.Socket | null;
	lampIp: string;

	private constructor (lampIp: string) {
		this.lampIp = lampIp;
		this.connection = null;
	}

	/**
	 * The main "constructor" of this class. It creates a TCP connection to the
	 * target lamp, and keeps the connection open for sending messages.
	 */
	static async create (lampIp: string) {
		const sender = new LampSender(lampIp);

		const socket = await new Promise<net.Socket>(resolve => {
			const socket: net.Socket = net.createConnection({
				port: 55443,
				host: sender.lampIp,
				family: 4,
			});

			socket.on('connect', () => resolve(socket));

			socket.on('close', () => {
				if (sender.connection === socket) sender.connection = null;
			});
		});

		sender.connection = socket;

		return sender;
	}

	/**
	 * Sends a message to the lamp that this LampSender is attached to.
	 * @returns The result message, sent by the lamp.
	 */
	async sendMessage (message: string) {
		return new Promise<LampResponse>((resolve, reject) => {
			if (!this.connection) throw new Error('You must have an active connection.');

			this.connection.once('data', data => {
				const dataString = data.toString('utf8');
				try {
					const dataObj = JSON.parse(dataString) as LampResponse;
					resolve(dataObj);
				} catch (e) {
					console.log(`failed to parse '${dataString}'`);
					reject(e);
				}
			});
			this.connection.write(message);
		});
	}

	/**
	 * This static function creates a LampSender and immediatly sends a message thgouth it.
	 * It's useful if you want to send a message and disconnect.
	 */
	static async sendMessage (lampIp: string, message: string) {
		const sender = await LampSender.create(lampIp);
		const response = await sender.sendMessage(message);
		return response;
	}
}