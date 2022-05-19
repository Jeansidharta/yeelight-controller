/******************************************************************************/
/*                           What is this file?                               */
/*                                                                            */
/* This file has code that stores all lamp states that were discovered in the */
/* network.                                                                   */
/*                                                                            */
/******************************************************************************/

import { Lamp } from '.';
import { sleep } from '../lib/sleep';
import { log, LoggerLevel } from '../logger';
import { LampState } from '../models/lamp-state';

export const lamps: Record<number, Lamp> = Object.create(null);
let lampsCount = 0;

export async function addOrUpdateLamp(lampInfo: LampState) {
	if (!lamps[lampInfo.id]) {
		lampsCount++;
		log(`New lamp discovered of ID ${lampInfo.id}`, LoggerLevel.COMPLETE);
	}
	log(`Lamp of ID ${lampInfo.id} updated`, LoggerLevel.COMPLETE);
	const newLamp = await Lamp.create(lampInfo);
	lamps[lampInfo.id] = newLamp;
}

export function getAllFoundLamps() {
	return Object.values(lamps);
}

export function removeLamp(lampId: number) {
	if (lamps[lampId]) lampsCount--;
	lamps[lampId]?.destroy();
	delete lamps[lampId];
}

export async function waitUntilHasLamp() {
	while (Object.values(lamps).length === 0) await sleep(500);
}

export function getLamp(lampId?: number) {
	if (lampId) return lamps[lampId];
	else return Object.values(lamps)[Math.floor(Math.random() * lampsCount)];
}
