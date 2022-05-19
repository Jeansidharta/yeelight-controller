"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LampResponse = void 0;
const logger_1 = require("../logger");
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
            logger_1.log(`Received Response Data: ${response}`, logger_1.LoggerLevel.DEBUG);
            try {
                const object = JSON.parse(response);
                return new LampResponse(object.id, object.result, object.params, object.method, object.error);
            }
            catch (e) {
                logger_1.log(`Failed to parse string '${response}' as lamp response object`, logger_1.LoggerLevel.MINIMAL);
                throw e;
            }
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
