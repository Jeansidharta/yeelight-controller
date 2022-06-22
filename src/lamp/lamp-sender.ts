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

	constructor(lampIp: string, lampId: number) {
		this.lampIp = lampIp;
		this.lampId = lampId;
		this.connection = null;
		this.connect();
	}

	connect() {
		const socket = net.createConnection({
			port: 55443,
			host: this.lampIp,
			family: 4,
		});

		log(`Connecing to lamp on "${this.lampIp}"...`, LoggerLevel.COMPLETE);
		socket.on('connect', () => {
			log(`Connected to lamp on "${this.lampIp}"`, LoggerLevel.COMPLETE);
		});

		socket.on('error', err => {
			log(`ERROR ON LAMP SENDER WITH LAMP ${this.lampIp} ${err}`, LoggerLevel.MINIMAL);
		});

		socket.on('close', () => {
			log(`Connection closed lamp on "${this.lampIp}"`, LoggerLevel.COMPLETE);
			this.connection = null;
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

	async sendMessage(message: string) {
		if (!this.connection) this.connect();
		this.connection!.write(message);
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
