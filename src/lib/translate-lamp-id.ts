import {
	LAMP_ID_JEAN,
	LAMP_ID_MIDDLE,
	LAMP_ID_RAFA,
	LAMP_ID_STRIP_JEAN,
	LAMP_ID_TV,
	LAMP_ID_WINDOW,
} from '../models/lamp-ids';

export function translateLampId(lampId: number) {
	switch (lampId) {
		case LAMP_ID_JEAN:
			return 'LAMP_JEAN';
		case LAMP_ID_MIDDLE:
			return 'LAMP_MIDDLE';
		case LAMP_ID_RAFA:
			return 'LAMP_RAFA';
		case LAMP_ID_STRIP_JEAN:
			return 'LAMP_STRIP_JEAN';
		case LAMP_ID_TV:
			return 'LAMP_TV';
		case LAMP_ID_WINDOW:
			return 'LAMP_WINDOW';
		default:
			return `Unknown lamp id ${lampId}`;
	}
}
