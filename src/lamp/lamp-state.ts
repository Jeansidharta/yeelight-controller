export type LampState = {
	ip: string,
	id: number,
	model: string,
	firmwareVersion: number,
	supportedMethods: string[],
	isPowerOn: boolean,
	bright: number,
	colorMode: 1 | 2 | 3 ,
	colorTemperature: number,
	rgb: number,
	hue: number,
	sat: number,
	name: string,
};