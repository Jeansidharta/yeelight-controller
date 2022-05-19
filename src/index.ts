import { sendDiscoveryMessage } from './discovery';
import { getAllFoundLamps, getLamp } from './lamp/lamps-cache';
import express from 'express';
import cors from 'cors';
import { sleep } from './lib/sleep';
import { jsonStringifyDOM } from './lib/json-stringify-dom';
import { log, LoggerLevel } from './logger';

const PORT = process.env.PORT || 3056;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/lamp', async (_req, res) => {
	const lamps = getAllFoundLamps();

	res.status(200).send(lamps.map(lamp => lamp.state));
});

app.get('/lamp/readable', async (_req, res) => {
	const lamps = getAllFoundLamps();
	const states = lamps.map(lamp => lamp.state);
	res.status(200).send(`
		<html>
			<body>
				${jsonStringifyDOM(states)}
			</body>
		</html>
	`);
});

app.get('/lamp/:id/readable', async (req, res) => {
	const id = Number(req.params.id as string);
	if (Number.isNaN(id)) return res.status(400).send('The ID must be a number');
	const lamp = getLamp(id);
	if (!lamp) return res.status(404).send('Lamp not found');

	res.status(200).send(`
		<html>
			<body>
				${jsonStringifyDOM(lamp.state)}
			</body>
		</html>
	`);
	return;
});

app.post('/lamp/music-mode', async (req, res) => {
	const method = req.body.method as string;
	const targets = req.body.targets as number[];

	if (method !== 'on' && method !== 'off') {
		return res.status(400).send('Invalid method, must be on or off. Received ' + method);
	}

	const promiseResults = await Promise.allSettled(
		targets.map(async targetId => {
			log(`Turning music mode ${method} at ${targetId}`, LoggerLevel.COMPLETE);
			const lamp = getLamp(targetId);
			if (!lamp) return new Error(`Could not find lamp ${targetId}`);
			await lamp.setMusic(method);
			return { id: lamp.id, state: lamp.state };
		}),
	);

	const responses = promiseResults.map(result => {
		if (result.status === 'fulfilled') {
			return result.value;
		} else {
			return { error: result.reason.message as string };
		}
	});

	if (responses.some(r => (r as any).error)) return res.status(400).send(responses);
	else return res.status(200).send(responses);
});

app.post('/lamp/rawmethod', async (req, res) => {
	const method = req.body.method as string;
	const params = req.body.args as string[];
	const targets = req.body.targets as number[];
	log(
		`Received raw method "${method}" with params "${params}" for targets "${targets}"`,
		LoggerLevel.DEBUG,
	);

	const promiseResults = await Promise.allSettled(
		targets.map(async targetId => {
			const lamp = getLamp(targetId);
			if (!lamp) throw new Error(`Could not find lamp ${targetId}`);
			await lamp.createAndSendMessage({ method, params });
			return { id: lamp.id, state: lamp.state };
		}),
	);

	const responses = promiseResults.map(result => {
		if (result.status === 'fulfilled') {
			return result.value;
		} else {
			return { error: result.reason.message as string };
		}
	});

	if (responses.some(r => (r as any).error)) return res.status(400).send(responses);
	else return res.status(200).send(responses);
});

app.post('/refresh-lamps', async (_req, res) => {
	try {
		await sendDiscoveryMessage();
	} catch (e) {
		return res.status(500).send('Failed to send discovery message to lamps');
	}
	await sleep(1000);
	const lamps = getAllFoundLamps();

	return res.status(200).send(lamps.map(lamp => lamp.state));
});

app.listen(PORT, () => {
	log(`Listening on port ${PORT}`, LoggerLevel.MINIMAL);
});

sendDiscoveryMessage();
