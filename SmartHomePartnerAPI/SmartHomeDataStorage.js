class SmartHomeDataStorage {
    constructor() {
        this.devices = new Map();
        this.languageTranslation = new Map();
        this.compatibilityConfiguration = new Map();

        this.timestamp = 0;
        this.languageTranslationVersion = 0;
        this.compatibilityConfigurationVersion = 0;
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
    }

    removeDevice(deviceID) {
        let removedDevice = this.devices.get(deviceID);
        zhis.devices.delete(deviceID);
    }

    getLanguageTranslation(languageKey) {

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