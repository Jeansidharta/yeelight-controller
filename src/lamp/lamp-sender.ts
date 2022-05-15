import net from 'net';
import { log, LoggerLevel } from '../logger';
import { LampResponse } from './lamp-response';

/**
 * This class is responsible for sending messages to a lamp.
 */
export class LampSender {
	connection: net.Socket | null;
	lampIp: string;
	onReceivedDataFromLamp?: (lampResponse: LampResponse) => void;

	destroy () {
		this.connection?.destroy();
	}

	get isConnected () {
		return this.connection !== null;
	}

	private constructor (lampIp: string) {
		this.lampIp = lampIp;
		this.connection = null;
		this.onReceivedDataFromLamp = undefined;
	}

	async connect () {
		const socket = await new Promise<net.Socket>(resolve => {
			log(`Opening Connection with lamp ${this.lampIp}`, LoggerLevel.COMPLETE);
			const socket: net.Socket = net.createConnection({
				port: 55443,
				host: this.lampIp,
				family: 4,
			});

			socket.on('connect', () => resolve(socket));

			socket.on('error', err => {
				log(`ERROR ON LAMP SENDER WITH LAMP ${this.lampIp} ${err}`, LoggerLevel.MINIMAL);
			});

			socket.on('close', () => {
				if (this.connection) {
					log(`Connection closed with current lamp ${this.lampIp}`, LoggerLevel.COMPLETE);
					this.connection.destroy();
					this.connection = null;
				} else {
					log(`Connection closed with unknown lamp ${this.lampIp}`, LoggerLevel.COMPLETE);
				}
			});
		});

		socket.on('data', data => {
			const dataString = data.toString('utf8');
			try {
				const responses = LampResponse.createFromString(dataString);
				if (this.onReceivedDataFromLamp) {
					responses.forEach(response => this.onReceivedDataFromLamp!(response));
				}
			} catch (e: unknown) {
				const error = e as Error;
				// Prevent whole app from crashing.
				log(error.message, LoggerLevel.MINIMAL);
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
		// sender.connect();
		return sender;
	}

	/**
	 * Sends a message to the lamp that this LampSender is attached to.
	 * @returns The result message, sent by the lamp.
	 */
	async sendMessage (message: string) {
		if (!this.connection) throw new Error('You must have an active connection.');
		this.connection.write(message);
		return new Promise<LampResponse>((resolve, reject) => {
			const connection = this.connection!;
			connection.on('data', function handleData (chunk) {
				const responses = LampResponse.createFromString(chunk.toString('utf8'));
				responses.some(response => {
					if (!response.isResult() && !response.isError()) return false;

					if (response.isError()) reject(response)
					else resolve(response);

					connection.off('data', handleData);
					return true;
				});
			});
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