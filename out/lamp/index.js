"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lamp = void 0;
const parse_lamp_method_to_legible_name_1 = require("../lib/parse-lamp-method-to-legible-name");
const logger_1 = require("../logger");
const lamp_methods_1 = require("./lamp-methods");
const lamp_sender_1 = require("./lamp-sender");
const music_server_1 = require("./music-server");
const defaultState = {
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
};
/**
 * This class represents a single lamp. It handles everything about it.
 */
class Lamp {
    constructor(state, sender) {
        this.state = state;
        this.sender = sender;
        this.musicServer = null;
        this.id = state.id;
        this.ip = state.ip;
    }
    updateState(untreatedState) {
        const treatedState = {};
        console.log('Received untreated state', untreatedState);
        Object.entries(untreatedState).forEach(entry => {
            const stateKey = entry[0];
            const stateValue = entry[1];
            delete untreatedState[stateKey];
            const parsedKey = parse_lamp_method_to_legible_name_1.parseLampMethodToLegibleName(stateKey);
            treatedState[parsedKey] = parse_lamp_method_to_legible_name_1.parseLampMethodValue(stateKey, stateValue);
        });
        console.log('Received treated state', untreatedState);
        this.state = { ...this.state, ...treatedState };
    }
    /**
     * The main "constructor" of this class. It initializes everything.
     */
    static async create(state) {
        const sender = await lamp_sender_1.LampSender.create(state.ip);
        const lamp = new Lamp({ ...defaultState, ...state }, sender);
        sender.onReceivedDataFromLamp = lampResponse => {
            if (lampResponse.isResult()) {
                if (lampResponse.isResultOk()) {
                    logger_1.log(`Received confirmation from lamp ${lamp.id}`, logger_1.LoggerLevel.COMPLETE);
                }
                else {
                    logger_1.log(`Received failure from lamp ${lamp.id}`, logger_1.LoggerLevel.MINIMAL);
                }
                return;
            }
            else if (lampResponse.isUpdate()) {
                logger_1.log(`Update received from lamp ${lamp.id} ${JSON.stringify(lampResponse.params)}`, logger_1.LoggerLevel.COMPLETE);
                const params = lampResponse.params;
                if (!params)
                    return;
                lamp.updateState(params);
            }
            else if (lampResponse.isError()) {
                logger_1.log(`Lamp ${lamp.id} error message: ${lampResponse.error.message}`, logger_1.LoggerLevel.MINIMAL);
            }
            else {
                logger_1.log(`Received unknown message from lamp ${lampResponse}`, logger_1.LoggerLevel.MINIMAL);
            }
        };
        return lamp;
    }
    async restartSenderIfNecessary() {
        if (!this.sender.isConnected)
            await this.sender.connect();
    }
    destroy() {
        this.sender?.destroy();
        this.musicServer?.destroy();
    }
    /**
     * Creates a message and sends it to the lamp. If the music mode was turnet on,
     * the message will be sent by that connection.
     */
    async createAndSendMessage({ method, params }) {
        const methodObject = {
            id: this.state.id,
            method,
            params,
        };
        const message = JSON.stringify(methodObject) + '\r\n';
        if (this.musicServer) {
            logger_1.log('Sending through music server', logger_1.LoggerLevel.DEBUG);
            this.musicServer.sendMessage(message);
        }
        else {
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
    async setMusic(action) {
        if (action === 'on') {
            if (this.musicServer) {
                logger_1.log('Music mode is already on', logger_1.LoggerLevel.MINIMAL);
                return;
            }
            const server = await music_server_1.MusicServer.create(this.state.ip);
            const response = await this.createAndSendMessage({
                method: 'set_music',
                params: [lamp_methods_1.MusicAction[action], server.ip, server.port],
            });
            this.musicServer = server;
            return response;
        }
        else {
            if (!this.musicServer)
                return;
            this.musicServer.destroy();
            this.musicServer = null;
            this.updateState({ music_on: 0 });
            return;
        }
    }
}
exports.Lamp = Lamp;
