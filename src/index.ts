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

app.post('/lamp/rawmethod', async (req, res) => {
	const method = req.body.method as string;
	const args = req.body.args as string[];
	const targets = req.body.targets as number[];

	const responses = await Promise.allSettled(targets.map(async targetId => {
		console.log(`Sending method '${method}' to ${targetId}`);
		const lamp = getLamp(targetId);
		if (!lamp) return new Error(`Could not find lamp ${targetId}`);
		try {
			await lamp.createAndSendMessage(method, args);
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