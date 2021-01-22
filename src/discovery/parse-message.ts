import { LampState } from "../lamp/lamp-state";

function validateMessageFirstLine(firstLine: string) {
	if (firstLine.startsWith('NOTIFY * HTTP/1.1')) {
		console.log('Received notify message');
	} else if (firstLine.startsWith('HTTP/1.1 200 OK')) {
		console.log('Received discovery response message');
	} else return false;
	return true;
}

/**
 * Parses SSDP messages (both discovery and notification messages).
 */
export function parseMessage (message: string) {
	const lines = message.split('\r\n');

	// If cannot recognize the header, skip this message.
	if (!validateMessageFirstLine(lines.shift() || '')) return;

	const headers: Record<string, string> = Object.create(null);

	// Collect all headers
	for(const line of lines) {
		if (!line) continue;

		const headerRegex = /^\s*(.+)\s*:\s+(.*)\s*$/;
		const regexResult = line.match(headerRegex);
		const [, headerName, headerValue] = regexResult || [];

		if (!headerName) {
			console.log(`Malformated header line: '${line}'`);
			continue;
		}

		headers[headerName] = headerValue || '';
	}

	// Collect the IP address
	const ipMatchResult = (headers.Location || '').match(/yeelight:\/\/([\d.]+):([\d.]+)/);
	if (!ipMatchResult || !ipMatchResult[1]) {
		console.log(`Incorrect Location header '${headers.Location}'. Skipping response...`);
		return;
	}

	return {
		bright: Number(headers.bright),
		colorTemperature: Number(headers.ct),
		colorMode: Number(headers.color_mode) as 1 | 2 | 3,
		firmwareVersion: Number(headers.fw_ver),
		hue: Number(headers.hue),
		id: parseInt((headers.id || '').substr(2), 16),
		ip: ipMatchResult[1],
		model: headers.model!,
		name: headers.name!,
		isPowerOn: headers.power === 'on',
		rgb: Number(headers.rgb),
		sat: Number(headers.sat),
		supportedMethods: (headers.support || '').split(' '),
	} as LampState;
}