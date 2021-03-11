export class LampResponse {
	id: number;
	result?: ['ok'];
	params?: any[];
	method?: string;

	private constructor (id: number, result?: ['ok'], params?: any[], method?: string) {
		this.id = id;
		this.result = result;
		this.params = params;
		this.method = method;
	}

	static createFromString (responses: string) {
		return responses.split('\r\n').map(response => {
			if (!response) return;
			let responseObject: LampResponse;
			try {
				const object = JSON.parse(response) as LampResponse;
				responseObject = new LampResponse(object.id, object.result, object.params, object.method);
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
}