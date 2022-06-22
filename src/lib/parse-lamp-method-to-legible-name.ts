import { log, LoggerLevel } from '../logger';
import { LampState, RawLampState } from '../models/lamp-state';

const NameLegibilityTable: Record<keyof RawLampState, keyof LampState> = {
	bright_with_zero: 'brightWithZero',
	brightness_with_zero: 'brightnessWithZero',
	bright: 'bright',
	color_mode: 'colorMode',
	ct: 'colorTemperature',
	fw_ver: 'firmwareVersion',
	hue: 'hue',
	id: 'id',
	ip: 'ip',
	model: 'model',
	name: 'name',
	power: 'isPowerOn',
	rgb: 'rgb',
	sat: 'saturation',
	support: 'supportedMethods',
	flowing: 'flowing',
	flow_params: 'flowParams',
	music_on: 'isMusicModeOn',
	smart_switch: 'smartSwitch',
	init_power_opt: 'initPowerOption',
	lan_ctrl: 'lanControl',
	delayoff: 'delayOff',
	save_state: 'saveState',
} as const;

type NameLegibilityTable = typeof NameLegibilityTable;

const ValueParsingTable: Record<keyof RawLampState, (val: any) => any> = {
	bright_with_zero: (val: string) => Number(val),
	brightness_with_zero: (val: string) => Number(val),
	bright: (val: string) => Number(val),
	color_mode: (val: string) => {
		const valNumber = Number(val);
		if (valNumber === 1) return 'rgb';
		else if (valNumber === 2) return 'temperature';
		else return 'hsv';
	},
	ct: (val: string) => Number(val),
	fw_ver: (val: string) => val,
	hue: (val: string) => Number(val),
	ip: (val: string) => val,
	id: (val: string) => {
		if (typeof val === 'string') {
			return parseInt(val.substring(2), 16);
		} else {
			return Number(val);
		}
	},
	model: (val: string) => val,
	name: (val: string) => val,
	power: (val: string) => val === 'on',
	rgb: (val: string) => Number(val),
	sat: (val: string) => Number(val),
	support: (val: string) => val.split(' '),
	flowing: (val: string) => Boolean(val),
	flow_params: (val: string) => {
		const allNumbers = val.split(',').map(num => Number(num));
		const args: [number, number, number, number][] = [];
		for (let i = 0; i < allNumbers.length; i += 4) {
			args.push(allNumbers.slice(i, i + 4) as [number, number, number, number]);
		}
		return args;
	},
	music_on: (val: string) => Boolean(val),
	smart_switch: (val: string) => Boolean(val),
	init_power_opt: (val: string) => Number(val),
	lan_ctrl: (val: string) => Boolean(val),
	delayoff: (val: string) => Boolean(val),
	save_state: (val: string) => val,
} as const;

export function parseLampMethodToLegibleName<T extends keyof NameLegibilityTable>(
	method: T,
): NameLegibilityTable[T] {
	return NameLegibilityTable[method];
}

export function parseLampMethodValue<T extends keyof NameLegibilityTable>(
	method: T,
	value: any,
): LampState[NameLegibilityTable[T]] {
	try {
		return ValueParsingTable[method](value);
	} catch (e) {
		log(
			`Failed fetch function from ValueParsingTable for method ${method}, with value ${value}`,
			LoggerLevel.MINIMAL,
		);
		throw e;
	}
}
