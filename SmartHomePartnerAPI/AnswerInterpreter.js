class AnswerInterpreter {
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    parseAndCheck(data) {
        if (data) {
            let parse = JSON.parse(data);
            if (parse.hasOwnProperty('responseCode')) {
                if (parse.responseCode === -1) {
                    throw new Error('failed MessageType');
                } else if (parse.responseCode === 0) {
                    throw new Error('unkown MessageType');
                } else if (parse.responseCode === 1) {
                    return (parse);
                }
            } else {
                throw new Error('failed JSON parse');
            }
        } else {
            throw new Error('failed missing data');
        }
    }

    parseHelo(data) {
        const parse = this.parseAndCheck(data);
        if (parse.hasOwnProperty('response')) {
            if (parse.response.hasOwnProperty('salt') && parse.response.hasOwnProperty('sessionSalt')) {
                return parse.response;
            } else {
                throw new Error('failed missing keys');
            }
        } else {
            throw new Error('failed missing keys');
        }
    }

    parseLogin(data) {
        const parse = this.parseAndCheck(data);
        if (parse.hasOwnProperty('response')) {
            if (parse.response.hasOwnProperty('MacAddress') && parse.response.hasOwnProperty('hardware') && parse.response.hasOwnProperty('localSHServerTime') && parse.response.hasOwnProperty('sessionID') && parse.response.hasOwnProperty('shsVersion')) {
                return parse.response;
            } else {
                throw new Error('failed missing keys');
            }
        } else {
            throw new Error('failed missing keys');
        }
    }

    parseAndStoreNewInfos(data) {
        this.parseAndCheck(data);
        if (data.hasOwnProperty('response')) {
            if (data.response.hasOwnProperty('currentTimestamp')) {
                if (data.response.hasOwnProperty('newDeviceInfos')) {
                    this.parseNewDeviceInfos(data.response.newDeviceInfos);
                }
                if (data.response.hasOwnProperty('newDeviceValues')) {
                    this.parseNewDeviceValues(data.response.newDeviceValues);
                }
            } else {
                throw new Error('failed missing keys');
            }
        } else {
            throw new Error('failed missing keys');
        }
    }

    parseNewDeviceInfos(data) {

    }

    parseNewDeviceValues(data) {

    }

}

module.exports = AnswerInterpreter;