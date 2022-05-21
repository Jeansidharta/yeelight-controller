export type MethodReturnValue = {
	method: string;
	params: any[];
};

/**
 * Defines how the given effect will be executed.
 * - Sudden will have it happen instantly.
 * - Smooth will have it transition smothly to the new state.
 */
export type EffectMode = 'sudden' | 'smooth';

/**
 * Defines to what mode the lamp will switch to when powered on.
 */
export enum PowerMode {
	/** Maintain previous configuration */
	Normal = 0,
	/** When powered on, lamp will switch to Color Temperature */
	TurnOnAndSwitchToCT = 1,
	/** When powered on, lamp will switch to RGB */
	TurnOnAndSwitchToRGB = 2,
	/** When powered on, lamp will switch to Hue, Saturation and value mode */
	TurnOnAndSwitchToHSV = 3,
	/** When powered on, lamp will switch to a flow state */
	TurnOnAndSwitchToFlow = 4,
	/** When powered on, lamp will switch to Night Light */
	TurnOnAndSwitchToNightLight = 5,
}

/**
 * Parameter used to define what happens after a control flow is done. It's used in the "start_cf" method
 */
export enum ControlFlowAction {
	/** Smart LED recover to the state before the color flow started. */
	RecoverState = 0,
	/** Smart LED maintains the state at which the flow stopped.
	 *
	 * Ex: flow: red -> green, when stopped will keep the lamp on green,
	 **/
	StayState = 1,
	/** Turn the lamp off when the flow stops. */
	TurnOff = 2,
}

/**
 * - **color**: change the smart LED to specified color and brightness.
 * - **hsv**: change the smart LED to specified color and brightness.
 * - **ct**: change the smart LED to specified ct and brightness.
 * - **cf**: start a color flow in specified fashion.
 * - **auto_delay_off**: turn on the smart LED to specified brightness and start a sleep
 *   timer to turn off the light after the specified minutes.
 */
export type LampClass = 'color' | 'hsv' | 'ct' | 'cf' | 'auto_delay_off';

/**
 * The direction of the adjustment (in set_adjust). The valid value can be
 * - **increase**: increase the specified property
 * - **decrease**: decrease the specified property
 * - **circle**: increase the specified property, after it reaches the max value, go back to minimum value.
 */
export type AdjustAction = 'increase' | 'decrease' | 'circle';

/**
 * The property to adjust (in set_adjust). The valid value can be:
 * - **bright**: adjust brightness.
 * - **ct**: adjust color temperature.
 * - **color**: adjust color. (When "prop" is "color", the "action" can only be "circle", otherwise, it will be deemed as invalid request.)
 */
export type AdjustProp = 'bright' | 'ct' | 'color';

/** Used in "set_music". Tell whether to turn the music mode on or off. */
export enum MusicAction {
	off = 0,
	on = 1,
}
