export type LampState = {
	ip: string,
	id: number,
	model: string,
	firmwareVersion: number,
	supportedMethods: string[],
	isPowerOn: boolean,
	bright: number,
	colorMode: 'rgb' | 'temperature' | 'hsv' ,
	colorTemperature: number,
	rgb: number,
	hue: number,
	saturation: number,
	name: string,
	flowing: boolean,
	flowParams?: [number, number, number, number][],
	isMusicModeOn: boolean,
};

export type RawLampState = {
	bright: number,
	color_mode: 1 | 2 | 3,
	ct: number,
	fw_ver: string,
	hue: number,
	id: number,
	model: string,
	name: string,
	power: 'on' | 'off',
	rgb: number,
	sat: number,
	support: string,
	flowing: 0 | 1,
	flow_params: string,
	music_on: 0 | 1,
};