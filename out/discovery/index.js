"use strict";
/******************************************************************************/
/*                           What is this file?                               */
/*                                                                            */
/* This file handles SSDP discovery and notification messages. It has methods */
/* to send a Discovery request messages, and if it receives a Discovery       */
/* response messages or a notification message, automatically parses it and   */
/* adds it to the "lamps" cache list.                                         */
/*                                                                            */
/******************************************************************************/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDiscoveryMessage = void 0;
const dgram_1 = __importDefault(require("dgram"));
const lamps_cache_1 = require("../lamp/lamps-cache");
const parse_message_1 = require("./parse-message");
/**
 * This messages must be like this.
 */
const DISCOVERY_MESSAGE = ('M-SEARCH * HTTP/1.1' + '\r\n' +
    'MAN: "ssdp:discover"' + '\r\n' +
    'ST: wifi_bulb');
/** The Multicast SSDP address */
const DISCOVERY_ADDRESS = '239.255.255.250';
const DISCOVERY_SOCKET_SOURCE_PORT = 55555;
const DISCOVERY_PORT = 1982;
const MULTICAST_TTL = 4;
let discoverySocket = null;
/**
 * This is the handler called whenever a Discovery response message or a Notify message
 * is received by either the discoverySocket or the notifySocket.
 *
 * The received message will be parsed and, if valid, will be treated as lamp information,
 * and will be stored in the lamp cache.
 */
async function handleSocketMessage(data) {
    const message = data.toString('utf8');
    const lamp = parse_message_1.parseMessage(message);
    if (!lamp)
        return;
    lamps_cache_1.addOrUpdateLamp(lamp);
}
/**
 * Creates and initializes the socket used for sending and receiving Discovery messages.
 */
async function createDiscoverySocket() {
    discoverySocket = dgram_1.default.createSocket('udp4');
    discoverySocket.bind(DISCOVERY_SOCKET_SOURCE_PORT);
    // Tells the kernel to listen to this muilticast address.
    await new Promise(resolve => {
        discoverySocket.once('listening', () => {
            discoverySocket.addMembership(DISCOVERY_ADDRESS);
            discoverySocket.setMulticastTTL(MULTICAST_TTL);
            resolve();
        });
    });
    discoverySocket.on('message', handleSocketMessage);
    return discoverySocket;
}
/**
 * Creates and initializes the socket used for receiving Notify messages.
 */
async function createNotifySocket() {
    const notifySocket = dgram_1.default.createSocket('udp4');
    // Binds the socket to the appropriate port.
    await new Promise(resolve => {
        notifySocket.bind(DISCOVERY_PORT, resolve);
    });
    console.log(`Listening for notify messages on port ${DISCOVERY_PORT}`);
    notifySocket.on('message', handleSocketMessage);
    return notifySocket;
}
/**
 * Sends a Discovery request message to the network. After receiving the Discovery
 * request message, all lamps in the network will send a Discovery response message
 * to the discoverySocket.
 */
async function sendDiscoveryMessage() {
    if (!discoverySocket)
        await createDiscoverySocket();
    console.log('Sending discovery message.');
    return new Promise((resolve, reject) => {
        discoverySocket.send(DISCOVERY_MESSAGE, DISCOVERY_PORT, DISCOVERY_ADDRESS, (error, bytesSent) => {
            if (error)
                reject(error);
            else
                resolve(bytesSent);
        });
    });
}
exports.sendDiscoveryMessage = sendDiscoveryMessage;
createNotifySocket();
