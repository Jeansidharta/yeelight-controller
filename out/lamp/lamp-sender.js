"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LampSender = void 0;
const net_1 = __importDefault(require("net"));
const lamp_response_1 = require("./lamp-response");
/**
 * This class is responsible for sending messages to a lamp.
 */
class LampSender {
    constructor(lampIp) {
        this.lampIp = lampIp;
        this.connection = null;
        this.onReceivedDataFromLamp = undefined;
    }
    destroy() {
        this.connection?.destroy();
    }
    get isConnected() {
        return this.connection !== null;
    }
    async connect() {
        const socket = await new Promise(resolve => {
            console.log('Opening Connection with lamp', this.lampIp);
            const socket = net_1.default.createConnection({
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
                }
                else {
                    console.log('Connection closed with unknown lamp', this.lampIp);
                }
            });
        });
        socket.on('data', data => {
            const dataString = data.toString('utf8');
            try {
                const responses = lamp_response_1.LampResponse.createFromString(dataString);
                if (this.onReceivedDataFromLamp) {
                    responses.forEach(response => this.onReceivedDataFromLamp(response));
                }
            }
            catch (e) {
                // Prevent whole app from crashing.
            }
        });
        this.connection = socket;
    }
    /**
     * The main "constructor" of this class. It creates a TCP connection to the
     * target lamp, and keeps the connection open for sending messages.
     */
    static async create(lampIp) {
        const sender = new LampSender(lampIp);
        sender.connect();
        return sender;
    }
    /**
     * Sends a message to the lamp that this LampSender is attached to.
     * @returns The result message, sent by the lamp.
     */
    async sendMessage(message) {
        if (!this.connection)
            throw new Error('You must have an active connection.');
        this.connection.write(message);
        return new Promise((resolve, reject) => {
            const connection = this.connection;
            connection.on('data', function handleData(chunk) {
                const responses = lamp_response_1.LampResponse.createFromString(chunk.toString('utf8'));
                responses.some(response => {
                    if (!response.isResult() && !response.isError())
                        return false;
                    if (response.isError())
                        reject(response);
                    else
                        resolve(response);
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
    static async sendMessage(lampIp, message) {
        const sender = await LampSender.create(lampIp);
        const response = await sender.sendMessage(message);
        return response;
    }
}
exports.LampSender = LampSender;
