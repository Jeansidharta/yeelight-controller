// import dgram from 'dgram';

import { sendDiscoveryMessage } from "./discovery";
import { ControlFlowAction, Lamp } from "./lamp";
import { getLamp, waitUntilHasLamp } from "./lamp/lamps-cache";

async function main () {
	// This is some sample code that will cycle from red to green to blue.

	await sendDiscoveryMessage();
	await waitUntilHasLamp();

	const lamp = await Lamp.create(getLamp()!);
	lamp.setLogLevel('results');
	await lamp.startControlFlow(0, ControlFlowAction.StayState, [
		[3000, 1, 0x0000FF, 100],
		[3000, 1, 0x00FF00, 100],
		[3000, 1, 0xFF0000, 100],
	]);
}

main();

// Prevents the main thread from dying
setInterval(() => {}, 1000000);