/******************************************************************************/
/*                           What is this file?                               */
/*                                                                            */
/* This file has code that stores all lamp states that were discovered in the */
/* network.                                                                   */
/*                                                                            */
/******************************************************************************/

import { Lamp } from '../lamp';
import { sleep } from '../lib/sleep';
import { translateLampId } from '../lib/translate-lamp-id';
import { log, LoggerLevel } from '../logger';
import { LampState } from '../models/lamp-state';
import { LampsEventEmitter } from './event-emitter';

export const lamps: Record<number, Lamp> = Object.create(null);
let lampsCount = 0;
export const lampsEventEmitter = new LampsEventEmitter();

export async function addOrUpdateLamp(lampInfo: Partial<LampState>, lampId?: number) {
	const id = lampId || lampInfo.id;
	if (!id) throw new Error(`function addOrUpdateLamp received an empty id`);
	const cachedLamp = lamps[id];
	if (!cachedLamp) {
		lampsCount++;
		log(
			`New lamp discovered of ID ${translateLampId(id)}, there are now ${lampsCount} lamps`,
			LoggerLevel.COMPLETE,
		);
		const newLamp = new Lamp(lampInfo);
		lamps[id] = newLamp;
		lampsEventEmitter.emit('NEW_LAMP', newLamp.state);
	} else {
		log(`Lamp of ID ${translateLampId(id)} updated`, LoggerLevel.COMPLETE);
		cachedLamp.updateState(lampInfo);
		lampsEventEmitter.emit('NEW_LAMP', cachedLamp.state);
	}
}

export function getAllFoundLamps() {
	return Object.values(lamps);
}

export function removeLamp(lampId: number) {
	if (lamps[lampId]) lampsCount--;
	lamps[lampId]?.destroy();
	delete lamps[lampId];
}

export async function waitUntilHasLamp(lampId: number) {
	while (!lamps[lampId]) await sleep(500);
}

export async function waitUntilHasAnyLamp() {
	while (Object.values(lamps).length === 0) await sleep(500);
}

export function getLamp(lampId: number) {
	return lamps[lampId];
}

export function getRandomLamp() {
	return Object.values(lamps)[Math.floor(Math.random() * lampsCount)];
}
