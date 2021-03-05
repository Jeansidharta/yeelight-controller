import net from 'net';
import { LampState } from './lamp-state';

export type LampResponse = {
	method: string,
	params: Record<keyof LampState, any>,
}

/**
 * This class is responsible for sending messages to a lamp.
 */
export class LampSender {
	connection: net.Socket | null;
	lampIp: string;
	onUpdate?: (lampResponse: LampResponse) => void;

	destroy () {
		this.connection?.destroy();
	}

	get isConnected () {
		return this.connection !== null;
	}

	private constructor (lampIp: string) {
		this.lampIp = lampIp;
		this.connection = null;
		this.onUpdate = undefined;
	}

	async connect () {
		const socket = await new Promise<net.Socket>(resolve => {
			console.log('Opening Connection with lamp', this.lampIp);
			const socket: net.Socket = net.createConnection({
				port: 55443,
				host: this.lampIp,
				family: 4,
			});

			socket.on('connect', () => resolve(socket));

			socket.on('error', err => {
				console.error('ERROR ON LAMP SENDER WITH LAMP', this.lampIp, err);
			});

			socket.on('close', () => {
				if (this.connection) {
					console.log('Connection closed with current lamp', this.lampIp);
					this.connection.destroy();
					this.connection = null;
				} else {
					console.log('Connection closed with unknown lamp', this.lampIp);
				}
			});
		});

		socket.on('data', data => {
			const dataString = data.toString('utf8');
			try {
				const dataObj = JSON.parse(dataString) as LampResponse;
				if (this.onUpdate) this.onUpdate(dataObj);
			} catch (e) {
				console.log(`failed to parse '${dataString}'`);
			}
		});

		this.connection = socket;
	}

	/**
	 * The main "constructor" of this class. It creates a TCP connection to the
	 * target lamp, and keeps the connection open for sending messages.
	 */
	static async create (lampIp: string) {
		const sender = new LampSender(lampIp);
		sender.connect();
		return sender;
	}

	/**
	 * Sends a message to the lamp that this LampSender is attached to.
	 * @returns The result message, sent by the lamp.
	 */
	sendMessage (message: string) {
		if (!this.connection) throw new Error('You must have an active connection.');
		this.connection.write(message);
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