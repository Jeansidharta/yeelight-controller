import { RawLampState } from '../models/lamp-state';
import { log, LoggerLevel } from '../logger';

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
export function parseMessage(message: string): Partial<RawLampState> | undefined {
	const lines = message.split('\r\n');
	const messageType = validateMessageFirstLine(lines.shift() || '');

	// If cannot recognize the header, skip this message.
	if (!messageType) return;

	const headers: Record<string, string> = Object.create(null);

	// Collect all headers
	for (const line of lines) {
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

	const lampState = {
		bright: headers.bright,
		ct: headers.ct,
		color_mode: headers.color_mode,
		fw_ver: headers.fw_ver,
		hue: headers.hue,
		// The ID must be handled here, so we know what lamp we're talking about
		id: parseInt((headers.id || '').substring(2), 16),
		ip: ipMatchResult[1],
		model: headers.model!,
		name: headers.name!,
		power: headers.power,
		rgb: headers.rgb,
		sat: headers.sat,
		support: headers.support,
	} as Partial<RawLampState>;

	return lampState;
}
