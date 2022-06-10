import { LampState, RawLampState } from '../models/lamp-state';
import {
	parseLampMethodToLegibleName,
	parseLampMethodValue,
} from './parse-lamp-method-to-legible-name';

export function parseRawLampState(rawState: Partial<RawLampState>): Partial<LampState> {
	const treatedState: Partial<LampState> = {};
	Object.entries(rawState).forEach(entry => {
		const stateKey = entry[0] as keyof RawLampState;
		const stateValue = entry[1] as RawLampState[typeof stateKey];

		const parsedKey = parseLampMethodToLegibleName(stateKey) as keyof LampState;
		treatedState[parsedKey] = parseLampMethodValue(stateKey, stateValue) as any as never;
	});
	return treatedState;
}
