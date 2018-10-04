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
        let parse = this.parseAndCheck(data);
        if (parse.hasOwnProperty('response')) {
            if (parse.response.hasOwnProperty('currentTimestamp')) {
                this.dataStore.timestamp = parse.response.currentTimestamp;
            }
            if (parse.response.hasOwnProperty('newDeviceInfos')) {
                this.parseAndStoreNewDeviceInfos(parse.response.newDeviceInfos);
            }
            if (parse.response.hasOwnProperty('newDeviceValues')) {
                this.parseAndStoreNewDeviceValues(parse.response.newDeviceValues);
            }
            if (parse.response.hasOwnProperty('newLanguageTranslation')) {
                this.parseAndStoreNewLanguageTraslation(parse.response.newLanguageTranslation);
            }
        } else {
            throw new Error('failed missing keys');
        }
    }

    parseAndStoreNewDeviceInfos(data) {
        if (data.length > 0) {
            for (let i = 0; i <= data.length; i++) {
                if (data[i].hasOwnProperty('deviceID')) {
                    this.dataStore.addDevice(data[i].deviceID, data[i], false);
                }
            }
        }
    }

    parseAndStoreNewDeviceValues(data) {

    }

    parseAndStoreNewLanguageTraslation(data) {
        if (data.hasOwnProperty('languageTranslationVersion')) {
            this.dataStore.languageTranslationVersion = data.languageTranslationVersion;
        }
        if (data.hasOwnProperty('newTranslatedStrings')) {
            if (data.newTranslatedStrings.length > 0) {
                for (let i = 0; i <= data.newTranslatedStrings.length; i++) {
                    if (data.newTranslatedStrings[i].hasOwnProperty('key') && data.newTranslatedStrings[i].hasOwnProperty('value')) {
                        this.dataStore.addLanguageTranslation(data.newTranslatedStrings[i].key, data.newTranslatedStrings[i].value);
                    }
                }
            }
        }
    }

}

module.exports = AnswerInterpreter;