import { RawLampState } from "./lamp-state";

type LampError = {
	code: number,
	message: string,
};

export class LampResponse {
	id: number;
	result?: ['ok'];
	params?: Partial<RawLampState>;
	method?: string;
	error?: LampError;

	private constructor (id: number, result?: ['ok'], params?: Partial<RawLampState>, method?: string, error?: LampError) {
		this.id = id;
		this.result = result;
		this.method = method;
		this.params = params;
		this.error = error;
	}

	static createFromString (responses: string) {
		return responses.split('\r\n').map(response => {
			if (!response) return;
			let responseObject: LampResponse;
			try {
				const object = JSON.parse(response) as LampResponse;
				responseObject = new LampResponse(object.id, object.result, object.params, object.method, object.error);
			} catch (e) {
				console.error(`Failed to parse string '${response}' as lamp response object`);
				throw e;
			}
			return responseObject;
		}).filter(r => r) as LampResponse[];
	}

	isResult () {
		return Boolean(this.result);
	}

	isResultOk () {
		return this.result && this.result[0] === 'ok';
	}

	isUpdate () {
		return this.method === 'props' && this.params;
	}

	isError () {
		return Boolean(this.error);
	}
}