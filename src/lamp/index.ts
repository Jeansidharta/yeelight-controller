import { log, LoggerLevel } from '../logger';
import { MethodReturnValue, MusicAction } from './lamp-methods/enums';
import { LampSender } from './lamp-sender';
import { LampState } from '../models/lamp-state';
import { MusicServer } from './music-server';

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
	brightnessWithZero: 0,
};

/**
 * This class represents a single lamp. It handles everything about it.
 */
export class Lamp {
	state: LampState;
	sender: LampSender | null = null;
	musicServer: MusicServer | null = null;

	get id() {
		return this.state.id;
	}

	get ip() {
		return this.state.ip;
	}

	constructor(state: Partial<LampState>) {
		this.state = { ...defaultState, ...state };
		this.sender = new LampSender(this.ip, this.id);
	}

	updateState(newState: Partial<LampState>) {
		this.state = { ...this.state, ...newState };
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
			id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
			method,
			params,
		};
		const message = JSON.stringify(methodObject) + '\r\n';
		if (this.musicServer) {
			log('Sending through music server', LoggerLevel.DEBUG);
			this.musicServer.sendMessage(message);
		} else {
			await this.sender!.sendMessage(message);
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
			this.updateState({ isMusicModeOn: false });
			return;
		}
	}
}
