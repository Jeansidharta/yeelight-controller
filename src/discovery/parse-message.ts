import { LampState } from "../models/lamp-state";
import { log, LoggerLevel } from "../logger";

function validateMessageFirstLine(firstLine: string): 'NOTIFY' | 'RESPONSE' | null {
	if (firstLine.startsWith('NOTIFY * HTTP/1.1')) {
		return 'NOTIFY';
	} else if (firstLine.startsWith('HTTP/1.1 200 OK')) {
		return 'RESPONSE';
	}
	return null;
}

/**
 * Parses SSDP messages (both discovery and notification messages).
 */
export function parseMessage (message: string): LampState | undefined {
	const lines = message.split('\r\n');
	const messageType = validateMessageFirstLine(lines.shift() || '');

	// If cannot recognize the header, skip this message.
	if (!messageType) return;

	const headers: Record<string, string> = Object.create(null);

	// Collect all headers
	for(const line of lines) {
		if (!line) continue;

		const headerRegex = /^\s*(.+)\s*:\s+(.*)\s*$/;
		const regexResult = line.match(headerRegex);
		const [, headerName, headerValue] = regexResult || [];

		if (!headerName) {
			log(`Malformated header line: '${line}'`, LoggerLevel.DEBUG);
			continue;
		}

		headers[headerName] = headerValue || '';
	}

	// Collect the IP address
	const ipMatchResult = (headers.Location || '').match(/yeelight:\/\/([\d.]+):([\d.]+)/);
	if (!ipMatchResult || !ipMatchResult[1]) {
		log(`Incorrect Location header '${headers.Location}'. Skipping response...`, LoggerLevel.DEBUG);
		return;
	}

	function parseColorMode () {
		const colorModeNumber = Number(headers.color_mode);
		if (colorModeNumber === 1) return 'rgb';
		else if (colorModeNumber === 2) return 'temperature';
		else return 'hsv';
	}

	const lampState = {
		bright: Number(headers.bright),
		colorTemperature: Number(headers.ct),
		colorMode: parseColorMode(),
		firmwareVersion: Number(headers.fw_ver),
		hue: Number(headers.hue),
		id: parseInt((headers.id || '').substring(2), 16),
		ip: ipMatchResult[1],
		model: headers.model!,
		name: headers.name!,
		isPowerOn: headers.power === 'on',
		rgb: Number(headers.rgb),
		saturation: Number(headers.sat),
		supportedMethods: (headers.support || '').split(' '),
	} as LampState;

	return lampState;
}