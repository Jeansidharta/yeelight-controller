import net from 'net';

export type LampResponse = {
	id: number,
	result: any[],
} | {
	id: number,
	error: {
		code: number,
		message: string,
	},
}

export class LampSender {
	connection: net.Socket | null;
	lampIp: string;

	private constructor (lampIp: string) {
		this.lampIp = lampIp;
		this.connection = null;
	}

	static async create (lampIp: string) {
		const sender = new LampSender(lampIp);

		const socket = await new Promise<net.Socket>(resolve => {
			const socket: net.Socket = net.createConnection({
				port: 55443,
				host: sender.lampIp,
				family: 4,
			});

			socket.on('connect', () => resolve(socket));

			socket.on('close', () => {
				if (sender.connection === socket) sender.connection = null;
			});
		});

		sender.connection = socket;

		return sender;
	}

	async sendMessage (message: string) {
		return new Promise<LampResponse>((resolve, reject) => {
			if (!this.connection) throw new Error('You must have an active connection.');

			this.connection.once('data', data => {
				const dataString = data.toString('utf8');
				try {
					const dataObj = JSON.parse(dataString) as LampResponse;
					resolve(dataObj);
				} catch (e) {
					console.log(`failed to parse '${dataString}'`);
					reject(e);
				}
			});
			this.connection.write(message);
		});
	}

	static async sendMessage (lampIp: string, message: string) {
		const sender = await LampSender.create(lampIp);
		const response = await sender.sendMessage(message);
		return response;
	}
}