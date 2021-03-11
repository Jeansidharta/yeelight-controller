import { sendDiscoveryMessage } from "./discovery";
import { getAllFoundLamps, getLamp } from "./lamp/lamps-cache";
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3056;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/lamp', async (_req, res) => {
	const lamps = getAllFoundLamps();

	res.status(200).send(lamps.map(lamp => lamp.state));
});

app.post('/lamp/music-mode', async (req, res) => {
	const method = req.body.method as string;
	const targets = req.body.targets as number[];

	if (method !== 'on' && method !== 'off') {
		return res.status(400).send('Invalid method, must be on or off. Received ' + method);
	}

	const responses = await Promise.allSettled(targets.map(async targetId => {
		console.log(`Turning music mode ${method} at ${targetId}`);
		const lamp = getLamp(targetId);
		if (!lamp) return new Error(`Could not find lamp ${targetId}`);
		try {
			await lamp.setMusic(method);
			return 'Ok';
		} catch(e) {
			return e.message;
		}
	}));

	if (responses.some(r => r instanceof Error)) return res.status(400).send(responses)
	else return res.status(200).send(responses);
});

app.post('/lamp/rawmethod', async (req, res) => {
	const method = req.body.method as string;
	const params = req.body.args as string[];
	const targets = req.body.targets as number[];

	const responses = await Promise.allSettled(targets.map(async targetId => {
		console.log(`Sending method '${method}' to ${targetId}`);
		const lamp = getLamp(targetId);
		if (!lamp) return new Error(`Could not find lamp ${targetId}`);
		try {
			await lamp.createAndSendMessage({ method, params });
			return 'Ok';
		} catch(e) {
			return e.message;
		}
	}));

	if (responses.some(r => r instanceof Error)) return res.status(400).send(responses)
	else return res.status(200).send(responses);
});

app.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`);
});

sendDiscoveryMessage();