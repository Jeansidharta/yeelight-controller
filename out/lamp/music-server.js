"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicServer = void 0;
const net_1 = __importDefault(require("net"));
const os_1 = __importDefault(require("os"));
/**
 * The port the music server runs on.
 */
const MUSIC_SERVER_PORT = 54321;
const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));
/**
 * Finds a valid IP address.
 */
function findMyIp() {
    const interfaces = os_1.default.networkInterfaces();
    for (const [interfaceName, interfaceInfo] of Object.entries(interfaces)) {
        if (!interfaceInfo)
            continue;
        if (interfaceName === 'lo')
            continue;
        for (const info of interfaceInfo) {
            if (info.internal)
                continue;
            if (info.family !== 'IPv4')
                continue;
            return info.address;
        }
    }
    return;
}
/**
 * This class is responsible for initializing and managing music servers.
 */
class MusicServer {
    constructor(ip, lampIp) {
        this.server = null;
        this.connections = [];
        this.ip = ip;
        this.lampIp = lampIp;
        this.port = MUSIC_SERVER_PORT;
    }
    /**
     * Kills, destroy and delete everything about the server.
     */
    destroy() {
        this.server = null;
        this.connections.forEach(connection => connection.destroy());
        this.connections = [];
    }
    /**
     * The main "constructor" for this class. It initializes a TCP server,
     * and attachest connection handlers to it.
     */
    static async create(lampIp) {
        const myIp = findMyIp();
        if (!myIp)
            throw new Error('Failed to find my IP');
        const musicServer = new MusicServer(myIp, lampIp);
        // Creates the server itself.
        const server = net_1.default.createServer();
        await new Promise(resolve => {
            server.listen(MUSIC_SERVER_PORT, () => {
                console.log(`listening for music on port ${MUSIC_SERVER_PORT}`);
                resolve();
            });
        });
        musicServer.server = server;
        // Connection handler
        server.on('connection', (clientSocket) => {
            musicServer.connections.push(clientSocket);
            clientSocket.on('close', () => {
                const index = musicServer.connections.findIndex(connection => connection === clientSocket);
                if (index !== -1)
                    musicServer.connections.splice(index, 1);
                clientSocket.destroy();
            });
        });
        return musicServer;
    }
    /**
     * Returns a promise that will only be resolved when at least one lamp has connected.
     */
    async waitForAtLeastOneConnection() {
        while (this.connections.length === 0)
            await sleep(100);
    }
    /**
     * Sends a message throught the server to all connected clients.
     */
    sendMessage(...messages) {
        if (!this.server)
            throw new Error('You must have an active server to send a message.');
        this.connections.forEach(connection => {
            messages.forEach(message => connection.write(message));
        });
    }
}
exports.MusicServer = MusicServer;
