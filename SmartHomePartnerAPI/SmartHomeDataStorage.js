class SmartHomeDataStorage {
    constructor(smartEventEmitter) {
        this.devices = new Map();
        this.deviceValues = new Map();
        this.languageTranslation = new Map();
        this.compatibilityConfiguration = new Map();
        this.smartEventEmitter = smartEventEmitter;
        this.initFinished = false;
        this.timestamp = 0;
        this.languageTranslationVersion = 0;
        this.compatibilityConfigurationVersion = 0;
    }

    getDeviceValue(deviceID) {
        return this.deviceValues.get(deviceID);
    }

    setDeviceValue(deviceID, value, noEmit) {
        //0 - STOP
        //1  - UP
        //2 - DOWN
        this.deviceValues.set(deviceID, value);
        const e = {'deviceID': deviceID, 'value': value};
        if (this.initFinished && !noEmit) {
            this.smartEventEmitter.emit('newDeviceValue', e);
        }
    }

    getDevice(deviceID) {
        return this.devices.get(deviceID);
    }

    addDevice(deviceID, deviceObj, force) {
        if (!force) {
            if (this.devices.get(deviceID)) {
                throw new Error('Device already in Storage, try force');
            }
        }
        this.devices.set(deviceID, deviceObj);
        const e = {deviceID: deviceID};
        if (this.initFinished) {
            this.smartEventEmitter.emit('newDevice', e);
        }
    }

    removeDevice(deviceID) {
        let removedDevice = this.devices.get(deviceID);
        this.devices.delete(deviceID);
        const e = {deviceID: deviceID};
        if (this.initFinished) {
            this.smartEventEmitter.emit('removedDevice', e);
        }
    }

    getLanguageTranslation(languageKey) {
        this.languageTranslation.get(languageKey);
    }

    addLanguageTranslation(languageKey, translation) {
        this.languageTranslation.set(languageKey, translation);
    }

    addCompatibilityConfiguration(system, compatibleDevices) {
        this.compatibilityConfiguration.set(system, compatibleDevices);
    }

    removeLanguageTranslation(languageKey) {

    }
}

module.exports = SmartHomeDataStorage;