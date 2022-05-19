"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discovery_1 = require("./discovery");
const lamps_cache_1 = require("./lamp/lamps-cache");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sleep_1 = require("./lib/sleep");
const json_stringify_dom_1 = require("./lib/json-stringify-dom");
const logger_1 = require("./logger");
const PORT = process.env.PORT || 3056;
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
app.get('/lamp', async (_req, res) => {
    const lamps = lamps_cache_1.getAllFoundLamps();
    res.status(200).send(lamps.map(lamp => lamp.state));
});
app.get('/lamp/readable', async (_req, res) => {
    const lamps = lamps_cache_1.getAllFoundLamps();
    const states = lamps.map(lamp => lamp.state);
    res.status(200).send(`
		<html>
			<body>
				${json_stringify_dom_1.jsonStringifyDOM(states)}
			</body>
		</html>
	`);
});
app.get('/lamp/:id/readable', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).send('The ID must be a number');
    const lamp = lamps_cache_1.getLamp(id);
    if (!lamp)
        return res.status(404).send('Lamp not found');
    res.status(200).send(`
		<html>
			<body>
				${json_stringify_dom_1.jsonStringifyDOM(lamp.state)}
			</body>
		</html>
	`);
    return;
});
app.post('/lamp/music-mode', async (req, res) => {
    const method = req.body.method;
    const targets = req.body.targets;
    if (method !== 'on' && method !== 'off') {
        return res.status(400).send('Invalid method, must be on or off. Received ' + method);
    }
    const promiseResults = await Promise.allSettled(targets.map(async (targetId) => {
        logger_1.log(`Turning music mode ${method} at ${targetId}`, logger_1.LoggerLevel.COMPLETE);
        const lamp = lamps_cache_1.getLamp(targetId);
        if (!lamp)
            return new Error(`Could not find lamp ${targetId}`);
        await lamp.setMusic(method);
        return { id: lamp.id, state: lamp.state };
    }));
    const responses = promiseResults.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return { error: result.reason.message };
        }
    });
    if (responses.some(r => r.error))
        return res.status(400).send(responses);
    else
        return res.status(200).send(responses);
});
app.post('/lamp/rawmethod', async (req, res) => {
    const method = req.body.method;
    const params = req.body.args;
    const targets = req.body.targets;
    logger_1.log(`Received raw method "${method}" with params "${params}" for targets "${targets}"`, logger_1.LoggerLevel.DEBUG);
    const promiseResults = await Promise.allSettled(targets.map(async (targetId) => {
        const lamp = lamps_cache_1.getLamp(targetId);
        if (!lamp)
            throw new Error(`Could not find lamp ${targetId}`);
        await lamp.createAndSendMessage({ method, params });
        return { id: lamp.id, state: lamp.state };
    }));
    const responses = promiseResults.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return { error: result.reason.message };
        }
    });
    if (responses.some(r => r.error))
        return res.status(400).send(responses);
    else
        return res.status(200).send(responses);
});
app.post('/refresh-lamps', async (_req, res) => {
    try {
        await discovery_1.sendDiscoveryMessage();
    }
    catch (e) {
        return res.status(500).send('Failed to send discovery message to lamps');
    }
    await sleep_1.sleep(1000);
    const lamps = lamps_cache_1.getAllFoundLamps();
    return res.status(200).send(lamps.map(lamp => lamp.state));
});
app.listen(PORT, () => {
    logger_1.log(`Listening on port ${PORT}`, logger_1.LoggerLevel.MINIMAL);
});
discovery_1.sendDiscoveryMessage();
