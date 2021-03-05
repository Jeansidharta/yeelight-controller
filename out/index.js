"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discovery_1 = require("./discovery");
const lamps_cache_1 = require("./lamp/lamps-cache");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const PORT = process.env.PORT || 3056;
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
app.get('/lamp', async (_req, res) => {
    const lamps = lamps_cache_1.getAllFoundLamps();
    res.status(200).send(lamps.map(lamp => lamp.state));
});
app.post('/lamp/rawmethod', async (req, res) => {
    const method = req.body.method;
    const args = req.body.args;
    const targets = req.body.targets;
    const responses = await Promise.allSettled(targets.map(async (targetId) => {
        console.log(`Sending method '${method}' to ${targetId}`);
        const lamp = lamps_cache_1.getLamp(targetId);
        if (!lamp)
            return new Error(`Could not find lamp ${targetId}`);
        try {
            await lamp.createAndSendMessage(method, args);
            return 'Ok';
        }
        catch (e) {
            return e.message;
        }
    }));
    if (responses.some(r => r instanceof Error))
        return res.status(400).send(responses);
    else
        return res.status(200).send(responses);
});
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
discovery_1.sendDiscoveryMessage();
