import { EventEmitter } from 'events';
import { LampState } from '../models/lamp-state';

export const LampsEvents = ['NEW_LAMP'] as const;
export type LampsEvents = typeof LampsEvents[number];

export class LampsEventEmitter extends EventEmitter {
	constructor() {
		super();
	}

	emit(event: LampsEvents, lampState: LampState): boolean {
		return super.emit(event, lampState);
	}

	on(event: LampsEvents, listener: (lampState: LampState) => void): this {
		super.on(event, listener);
		return this;
	}

	once(event: LampsEvents, listener: (lampState: LampState) => void): this {
		super.once(event, listener);
		return this;
	}

	addListener(event: LampsEvents, listener: (lampState: LampState) => void): this {
		super.addListener(event, listener);
		return this;
	}

	eventNames(): LampsEvents[] {
		return [...LampsEvents];
	}

	off(event: LampsEvents, listener: (lampState: LampState) => void): this {
		super.off(event, listener);
		return this;
	}
}
