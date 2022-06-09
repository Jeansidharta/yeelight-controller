import {
	parseLampMethodToLegibleName,
	parseLampMethodValue,
} from '../lib/parse-lamp-method-to-legible-name';
import { log, LoggerLevel } from '../logger';
import { MethodReturnValue, MusicAction } from './lamp-methods/enums';
import { LampSender } from './lamp-sender';
import { LampState, RawLampState } from '../models/lamp-state';
import { MusicServer } from './music-server';
import { translateLampId } from '../lib/translate-lamp-id';

const defaultState: LampState = {
	ip: '',
	id: 0,
	model: '',
	firmwareVersion: 0,
	supportedMethods: [],
	isPowerOn: false,
	bright: 0,
	colorMode: 'rgb',
	colorTemperature: 0,
	rgb: 0,
	hue: 0,
	saturation: 0,
	name: '',
	flowing: false,
	flowParams: undefined,
	isMusicModeOn: false,
	brightWithZero: 0,
	delayOff: false,
	initPowerOption: 0,
	lanControl: true,
	saveState: 0,
	smartSwitch: false,
};

/**
 * This class represents a single lamp. It handles everything about it.
 */
export class Lamp {
	state: LampState;
	sender: LampSender;
	musicServer: MusicServer | null;
	id: number;
	ip: string;

	private constructor(state: LampState, sender: LampSender) {
		this.state = state;
		this.sender = sender;
		this.musicServer = null;
		this.id = state.id;
		this.ip = state.ip;
	}

	updateState(untreatedState: Partial<RawLampState>) {
		const treatedState: Partial<LampState> = {};
		Object.entries(untreatedState).forEach(entry => {
			const stateKey = entry[0] as keyof RawLampState;
			const stateValue = entry[1] as RawLampState[typeof stateKey];
			delete untreatedState[stateKey];

			const parsedKey = parseLampMethodToLegibleName(stateKey) as keyof LampState;
			treatedState[parsedKey] = parseLampMethodValue(stateKey, stateValue) as any as never;
		});
		this.state = { ...this.state, ...treatedState };
	}

	/**
	 * The main "constructor" of this class. It initializes everything.
	 */
	static async create(state: LampState) {
		const sender = await LampSender.create(state.ip);
		const lamp = new Lamp({ ...defaultState, ...state }, sender);

		sender.onReceivedDataFromLamp = lampResponse => {
			if (lampResponse.isResult()) {
				if (lampResponse.isResultOk()) {
					log(`Received confirmation from lamp ${translateLampId(this.id)}`, LoggerLevel.COMPLETE);
				} else {
					log(`Received failure from lamp ${translateLampId(this.id)}`, LoggerLevel.MINIMAL);
				}
				return;
			} else if (lampResponse.isUpdate()) {
				log(
					`Update received from lamp ${translateLampId(this.id)} ${JSON.stringify(
						lampResponse.params,
					)}`,
					LoggerLevel.COMPLETE,
				);
				const params = lampResponse.params;
				if (!params) return;
				lamp.updateState(params);
			} else if (lampResponse.isError()) {
				log(
					`Lamp ${translateLampId(this.id)} error message: ${lampResponse.error!.message}`,
					LoggerLevel.MINIMAL,
				);
			} else {
				log(`Received unknown message from lamp ${lampResponse}`, LoggerLevel.MINIMAL);
			}
		};

		return lamp;
	}

	async restartSenderIfNecessary() {
		if (!this.sender.isConnected) await this.sender.connect();
	}

	destroy() {
		this.sender?.destroy();
		this.musicServer?.destroy();
	}

	/**
	 * Creates a message and sends it to the lamp. If the music mode was turnet on,
	 * the message will be sent by that connection.
	 */
	async createAndSendMessage({ method, params }: MethodReturnValue) {
		const methodObject = {
			id: this.state.id,
			method,
			params,
		};
		const message = JSON.stringify(methodObject) + '\r\n';
		if (this.musicServer) {
			log('Sending through music server', LoggerLevel.DEBUG);
			this.musicServer.sendMessage(message);
		} else {
			await this.restartSenderIfNecessary();
			await this.sender.sendMessage(message);
		}
	}

	/**
	 * This method is used to start or stop music mode on a device. Under music mode,
	 * no property will be reported and no message quota is checked.
	 *
	 * When control device wants to start music mode, it needs start a TCP
	 * server firstly and then call "set_music" command to let the device know the IP and Port of the
	 * TCP listen socket. After received the command, LED device will try to connect the specified
	 * peer address. If the TCP connection can be established successfully, then control device could
	 * send all supported commands through this channel without limit to simulate any music effect.
	 * The control device can stop music mode by explicitly send a stop command or just by closing
	 * the socket.
	 *
	 * @argument action Action of set_music command
	 */
	async setMusic(action: 'on' | 'off') {
		if (action === 'on') {
			if (this.musicServer) {
				log('Music mode is already on', LoggerLevel.MINIMAL);
				return;
			}
			const server = await MusicServer.create(this.state.ip);
			const response = await this.createAndSendMessage({
				method: 'set_music',
				params: [MusicAction[action], server.ip, server.port],
			});
			this.musicServer = server;
			return response;
		} else {
			if (!this.musicServer) return;
			this.musicServer.destroy();
			this.musicServer = null;
			this.updateState({ music_on: 0 });
			return;
		}
	}
}
