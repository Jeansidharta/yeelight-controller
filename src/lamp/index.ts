import { MethodValue } from "./lamp-methods";
import { LampSender } from "./lamp-sender";
import { LampState } from "./lamp-state";
import { MusicServer } from "./music-server";

type LogLevels = 'none' | 'results';

/**
 * This class represents a single lamp. It handles everything about it.
 */
export class Lamp {
	state: LampState;
	sender: LampSender;
	musicServer: MusicServer | null;
	logLevel: LogLevels;
	id: number;
	ip: string;

	private constructor (state: LampState, sender: LampSender) {
		this.state = state;
		this.sender = sender;
		this.musicServer = null;
		this.logLevel = 'none';
		this.id = state.id;
		this.ip = state.ip;
	}

	/**
	 * The log level is used to determined what info should be console.logged
	 *
	 * @argument newLevel The new log level.
	 * - **none**: Don't log anything. Silent mode.
	 * - **results**: Log the result of messages.
	 */
	setLogLevel (newLevel: LogLevels) {
		this.logLevel = newLevel;
	}

	/**
	 * The main "constructor" of this class. It initializes everything.
	 */
	static async create (state: LampState) {
		const sender = await LampSender.create(state.ip);
		const lamp = new Lamp(state, sender);

		sender.onReceivedDataFromLamp = lampResponse => {
			if (lampResponse.isResult()) {
				if (lampResponse.isResultOk() && lamp.logLevel === 'results') {
					console.log('Received confirmation from lamp', lamp.id);
				} else {
					console.log('Received failure from lamp', lamp.id);
				}
				return;
			} else if (lampResponse.isUpdate()) {
				if (lamp.logLevel === 'results') console.log('Update received from lamp', lamp.id, lampResponse.params);
				const params = lampResponse.params;
				lamp.state = { ...lamp.state, ...params };
			} else {
				console.error('Received unknown message from lamp', lampResponse);
			}
		}

		return lamp;
	}

	async restartSenderIfNecessary () {
		if (!this.sender.isConnected) await this.sender.connect();
	}

	destroy () {
		this.sender?.destroy();
		this.musicServer?.destroy();
	}

	/**
	 * Creates a message and sends it to the lamp. If the music mode was turnet on,
	 * the message will be sent by that connection.
	 */
	async createAndSendMessage (methodValue: MethodValue) {
		const methodObject = {
			id: this.state.id,
			method: methodValue.method,
			params: methodValue.params,
		};
		const message = JSON.stringify(methodObject) + '\r\n';
		if (this.musicServer) {
			console.log('Sending through music server');
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
	async setMusic (action: 'on' | 'off') {
		if (action === 'on') {
			if (this.musicServer) {
				console.error('Music mode is already on');
				return;
			}
			const server = await MusicServer.create(this.state.ip);
			const message = await this.createAndSendMessage({
				method: 'set_music',
				params: [action, server.ip, server.port],
			});
			this.musicServer = server;
			return message;
		} else {
			const response = await this.createAndSendMessage({
				method: 'set_music',
				params: [action],
			});
			if (this.musicServer) this.musicServer.destroy();
			this.musicServer = null;
			return response;
		}
	}
}