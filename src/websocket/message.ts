import { LampState } from '../models/lamp-state';

export const WebsocketMessageType = [
	'new-lamp-state',
	'request-all-lamps',
	'call-lamp-method',
] as const;
export type WebsocketMessageType = typeof WebsocketMessageType[number];

interface WebsocketMessageBase {
	type: WebsocketMessageType;
}

export function isWebsocketMessage(a: any): a is WebsocketMessageBase {
	return a && typeof a === 'object' && typeof a.type === 'string';
}

export interface WebsocketMessageLampState extends WebsocketMessageBase {
	type: 'new-lamp-state';
	data: LampState;
}

export function isWebsocketMessageLampState(a: any): a is WebsocketMessageLampState {
	return isWebsocketMessage(a) && a.type === 'new-lamp-state';
}

export interface WebsocketMessageRequestAllLamps extends WebsocketMessageBase {
	type: 'request-all-lamps';
}

export function isWebsocketMessageRequestAllLamps(a: any): a is WebsocketMessageRequestAllLamps {
	return isWebsocketMessage(a) && a.type === 'request-all-lamps';
}

export interface WebsocketMessageCallLampMethod extends WebsocketMessageBase {
	type: 'call-lamp-method';
	data: {
		args: any[];
		targets: number[];
		method: string;
	};
}

export function isWebsocketMessageCallLampMethod(a: any): a is WebsocketMessageCallLampMethod {
	return isWebsocketMessage(a) && a.type === 'call-lamp-method';
}

export type WebsocketMessage =
	| WebsocketMessageLampState
	| WebsocketMessageRequestAllLamps
	| WebsocketMessageCallLampMethod;
