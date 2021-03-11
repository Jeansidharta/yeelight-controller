import { LampState } from "../lamp/lamp-state";

const NameLegibilityTable = {
	'bright': 'bright',
	'color_mode': 'colorMode',
	'ct': 'colorTemperature',
	'fw_ver': 'firmwareVersion',
	'hue': 'hue',
	'id': 'id',
	'model': 'model',
	'name': 'name',
	'power': 'isPowerOn',
	'rgb': 'rgb',
	'sat': 'saturation',
	'support': 'supportedMethods',
} as const;

const ValueParsingTable = {
	'bright': (val: any) => Number(val),
	'color_mode': (val: any) => {
		if (val === 1) return 'rgb';
		else if (val === 2) return 'temperature';
		else return 'hsv';
	},
	'ct': (val: any) => Number(val),
	'fw_ver': (val: any) => val,
	'hue': (val: any) => Number(val),
	'id': (val: any) => {
		if (typeof val === 'string') {
			return parseInt(val.substr(2), 16);
		} else {
			return Number(val);
		}
	},
	'model': (val: any) => val,
	'name': (val: any) => val,
	'power': (val: any) => val === 'on',
	'rgb': (val: any) => Number(val),
	'sat': (val: any) => Number(val),
	'support': (val: any) => val.split(' '),
} as const;

type NameLegibilityTable = typeof NameLegibilityTable;

export function parseLampMethodToLegibleName <T extends keyof NameLegibilityTable> (method: T): NameLegibilityTable[T] {
	return NameLegibilityTable[method];
}

export function parseLampMethodValue <T extends keyof NameLegibilityTable> (method: T, value: any): LampState[NameLegibilityTable[T]] {
	return ValueParsingTable[method](value);
}