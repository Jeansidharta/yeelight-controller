"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LampResponse = void 0;
class LampResponse {
    constructor(id, result, params, method, error) {
        this.id = id;
        this.result = result;
        this.method = method;
        this.params = params;
        this.error = error;
    }
    static createFromString(responses) {
        return responses.split('\r\n').map(response => {
            if (!response)
                return;
            let responseObject;
            try {
                const object = JSON.parse(response);
                responseObject = new LampResponse(object.id, object.result, object.params, object.method, object.error);
            }
            catch (e) {
                console.error(`Failed to parse string '${response}' as lamp response object`);
                throw e;
            }
            return responseObject;
        }).filter(r => r);
    }
    isResult() {
        return Boolean(this.result);
    }
    isResultOk() {
        return this.result && this.result[0] === 'ok';
    }
    isUpdate() {
        return this.method === 'props' && this.params;
    }
    isError() {
        return Boolean(this.error);
    }
}
exports.LampResponse = LampResponse;
