import { LampState } from "../models/lamp-state";

const NameLegibilityTable = {
	'bright_with_zero': 'bright',
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
	'flowing': 'flowing',
	'flow_params': 'flowParams',
	'music_on': 'isMusicModeOn',
} as const;

const ValueParsingTable = {
	'bright_with_zero': (val: any) => Number(val),
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
	'flowing': (val: any) => Boolean(val),
	'flow_params': (val: string) => {
		const allNumbers = val.split(',').map(num => Number(num));
		const args: [number, number, number, number][] = [];
		for (let i = 0; i < allNumbers.length; i += 4) {
			args.push(allNumbers.slice(i, i + 4) as [number, number, number, number]);
		}
		return args;
	},
	'music_on': (val: any) => Boolean(val),
} as const;

type NameLegibilityTable = typeof NameLegibilityTable;

export function parseLampMethodToLegibleName <T extends keyof NameLegibilityTable> (method: T): NameLegibilityTable[T] {
	return NameLegibilityTable[method];
}

export function parseLampMethodValue <T extends keyof NameLegibilityTable> (method: T, value: any): LampState[NameLegibilityTable[T]] {
	return ValueParsingTable[method](value);
}