import net from 'net';
import { addOrUpdateLamp } from '../lamps-cache';
import { parseRawLampState } from '../lib/parse-raw-lamp-state';
import { translateLampId } from '../lib/translate-lamp-id';
import { log, LoggerLevel } from '../logger';
import { LampResponse } from './lamp-response';

/**
 * This class is responsible for sending messages to a lamp.
 */
export class LampSender {
	connection: net.Socket | null;
	lampIp: string;
	lampId: number;

	destroy() {
		this.connection?.destroy();
	}

	get isConnected() {
		return this.connection !== null;
	}

	private constructor(lampIp: string, lampId: number) {
		this.lampIp = lampIp;
		this.lampId = lampId;
		this.connection = null;
	}

	async connect() {
		const socket = await new Promise<net.Socket>(resolve => {
			log(`Connecing to lamp on "${this.lampIp}"...`, LoggerLevel.COMPLETE);
			const socket: net.Socket = net.createConnection({
				port: 55443,
				host: this.lampIp,
				family: 4,
			});

			socket.on('connect', () => {
				log(`Connected to lamp on "${this.lampIp}"`, LoggerLevel.COMPLETE);
				resolve(socket);
			});

			socket.on('error', err => {
				log(`ERROR ON LAMP SENDER WITH LAMP ${this.lampIp} ${err}`, LoggerLevel.MINIMAL);
			});

			socket.on('close', () => {
				if (this.connection) {
					log(`Connection closed lamp on "${this.lampIp}"`, LoggerLevel.COMPLETE);
					this.connection.destroy();
					this.connection = null;
				} else {
					log(`Connection closed with unknown lamp on "${this.lampIp}"`, LoggerLevel.COMPLETE);
				}
			});
		});

		socket.on('data', data => {
			const dataString = data.toString('utf8');
			try {
				const responses = LampResponse.createFromString(dataString);
				responses.forEach(response => this.onReceivedDataFromLamp!(response));
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
	static async create(lampIp: string, lampId: number) {
		const sender = new LampSender(lampIp, lampId);
		await sender.connect();
		return sender;
	}

	/**
	 * Sends a message to the lamp that this LampSender is attached to.
	 * @returns The result message, sent by the lamp.
	 */
	async sendMessage(message: string) {
		const connection = this.connection;
		if (!connection) throw new Error('You must have an active connection.');
		return new Promise<LampResponse>((resolve, reject) => {
			connection.on('data', function handleData(chunk) {
				const responses = LampResponse.createFromString(chunk.toString('utf8'));
				responses.some(response => {
					if (!response.isResult() && !response.isError()) return false;

					if (response.isError()) reject(response);
					else resolve(response);

					connection.off('data', handleData);
					return true;
				});
			});

			connection.write(message);
		});
	}

	onReceivedDataFromLamp(lampResponse: LampResponse) {
		if (lampResponse.isResult()) {
			if (lampResponse.isResultOk()) {
				log(
					`Received confirmation from lamp ${translateLampId(this.lampId)}`,
					LoggerLevel.COMPLETE,
				);
			} else {
				log(`Received failure from lamp ${translateLampId(this.lampId)}`, LoggerLevel.MINIMAL);
			}
			return;
		} else if (lampResponse.isUpdate()) {
			log(
				`Update received from lamp ${translateLampId(this.lampId)} ${JSON.stringify(
					lampResponse.params,
				)}`,
				LoggerLevel.COMPLETE,
			);
			const params = lampResponse.params;
			if (!params) return;
			addOrUpdateLamp(parseRawLampState(params), this.lampId);
		} else if (lampResponse.isError()) {
			log(
				`Lamp ${translateLampId(this.lampId)} error message: ${lampResponse.error!.message}`,
				LoggerLevel.MINIMAL,
			);
		} else {
			log(`Received unknown message from lamp ${lampResponse}`, LoggerLevel.MINIMAL);
		}
	}
}
