const SchellenbergShutter = require('./Shutter');
const SchellAPI = require("./SchellAPI");

let Accessory;
let Service;
let Characteristic;
let UUIDGen;

class SchellenbergPlatform {
    constructor(log, config, api) {
        log('SchellenbergPlatform');
        if (!api || !config) return;

        Accessory = api.hap.Accessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;
        UUIDGen = api.hap.uuid;
        let self = this;
        this.log = log;
        this.config = config;
        this.accessories = [];
        this.api = api;
        this.refreshInt = null;
        this.homebridgeAccessories = new Map();
        this.deviceAccessories = new Map();
        this.timestamp = 0;
        this.languageTranslationVersion = this.config.languageTranslationVersion || 0;
        this.compatibilityConfigurationVersion = this.compatibilityConfigurationVersion || 0;
        this.log('Fetching Schellenberg devices.');
        const req = SchellAPI.getAllNewInfosMessage(this.config.sessionId, this.timestamp, this.compatibilityConfigurationVersion, this.languageTranslationVersion);
        SchellAPI.tlsRequest(this.log, this.config.host, this.config.port, this.config.caPath, req, (data, err) => {
            if (err) {
                this.log(err.toString());
                this.unreachable();
                return;
            }
            if (data.hasOwnProperty('response')) {
                if (data.response.hasOwnProperty('newDeviceInfos')) {
                    for (let j = 0; j < data.response.newDeviceInfos.length; j++) {
                        const accessoryResult = data.response.newDeviceInfos[j];
                        self.addAccessory(accessoryResult);
                    }
                } else {
                    self.log.debug('Missing newDeviceInfos Key');
                }
            } else {
                self.log.debug('Missing response Key');
            }
            this.refreshInt = setInterval(() => {
                this.refreshStat();
            }, 7000);
            setTimeout(() => {
                this.setRollingTime()
            }, 2000);
        });
        this.api.on('didFinishLaunching', () => {
            this.log.debug('didFinishLaunching');

        });

    }

    setRollingTime() {
        if (this.config.hasOwnProperty('rollingTimes')) {
            this.log.debug('Configuring Rolling Times');
            for (let j = 0; j < this.config.rollingTimes.length; j++) {
                const currentTime = this.config.rollingTimes[j];
                if (currentTime.hasOwnProperty('deviceID') && currentTime.hasOwnProperty('time')) {
                    let deviceAccessory = this.deviceAccessories.get(currentTime.deviceID);
                    if (deviceAccessory) {
                        deviceAccessory.runStepShutterTime = currentTime.time / 100;
                        this.log('Set Rolling Time for %s to %s', deviceAccessory.runStepShutterTime, currentTime.deviceID);
                    }
                }
            }
        }
    }

    unreachable() {
        this.homebridgeAccessories.forEach((value, key) => {
            value.getService(Service.WindowCovering).setCharacteristic(Characteristic.StatusFault, 1);
        });
        this.deviceAccessories.forEach((value, key) => {
            value.reachable = 1;
        });
    }

    refreshStat() {
        let self = this;
        if (!this.refreshBlock) {
            const req = SchellAPI.getAllNewInfosMessage(this.config.sessionId, this.timestamp, this.compatibilityConfigurationVersion, this.languageTranslationVersion);
            SchellAPI.tlsRequest(this.log, this.config.host, this.config.port, this.config.caPath, req, (data, err) => {
                if (err) {
                    this.log(err.toString());
                    clearInterval(this.refreshInt);
                    this.unreachable();
                    return;
                }
                if (data.hasOwnProperty('response')) {
                    if (data.response.hasOwnProperty('currentTimestamp')) {
                        self.timestamp = data.response.currentTimestamp;
                    }
                    if (data.response.hasOwnProperty('newLanguageTranslation')) {
                        if (data.response.newLanguageTranslation.hasOwnProperty('languageTranslationVersion')) {
                            self.languageTranslationVersion = data.response.newLanguageTranslation.languageTranslationVersion;
                        }
                    }
                    if (data.response.hasOwnProperty('newCompatibilityConfiguration')) {
                        if (data.response.newCompatibilityConfiguration.hasOwnProperty('compatibilityConfigurationVersion')) {
                            self.compatibilityConfigurationVersion = data.response.newCompatibilityConfiguration.compatibilityConfigurationVersion;
                        }
                    }
                    if (data.response.hasOwnProperty('newDeviceInfos')) {
                        for (let j = 0; j < data.response.newDeviceInfos.length; j++) {
                            const accessoryResult = data.response.newDeviceInfos[j];
                            self.addAccessory(accessoryResult);
                        }
                    } else {
                        this.log('missing something please check config');
                    }
                    if (data.response.hasOwnProperty('newDeviceValues')) {
                        for (let j = 0; j < data.response.newDeviceValues.length; j++) {
                            let device = data.response.newDeviceValues[j];
                            if (device.hasOwnProperty('value')) {
                                let uuid = this.api.hap.uuid.generate(device.deviceID.toString());
                                let deviceAccessory = this.deviceAccessories.get(device.deviceID);
                                if (deviceAccessory) {
                                    try {
                                        const dev = deviceAccessory.homebridgeAccessory.getService(Service.WindowCovering);
                                        deviceAccessory.positionState = device.value;
                                        self.log(device.deviceID + ' ' + device.value);
                                        if (device.value == 2) {
                                            deviceAccessory.currentPosition = 0;
                                            dev.setCharacteristic(Characteristic.CurrentPosition, deviceAccessory.currentPosition);
                                            dev.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
                                        } else if (device.value == 1) {
                                            deviceAccessory.currentPosition = 100;
                                            dev.setCharacteristic(Characteristic.CurrentPosition, deviceAccessory.currentPosition);
                                            dev.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
                                        } else if (device.value == 0) {
                                            dev.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
                                        }
                                        self.log(device.deviceID + ' ' + deviceAccessory.positionState + ' ' + deviceAccessory.currentPosition);
                                    } catch (e) {
                                        self.log(e);
                                    }
                                }
                            }
                        }
                    } else {
                        this.log('missing something please check config');
                    }
                } else {
                    self.log('missing something please check config');
                }
            });
        } else {
            this.log('refresh blocked');
        }
    }

    registerPlatformAccessory(platformAccessory) {
        this.api.registerPlatformAccessories('homebridge-schellenberg-platform', 'SchellenbergPlatform', [platformAccessory]);
    }

    configureAccessory(accessory) {
        this.log('restoring device %s', accessory.UUID);
        this.homebridgeAccessories.set(accessory.UUID, accessory);
    }

    addAccessory(device) {
        let uuid = this.api.hap.uuid.generate(device.deviceID.toString());
        let homebridgeAccessory = this.homebridgeAccessories.get(uuid);
        let deviceAccessory = this.deviceAccessories.get(device.deviceID);
        if (deviceAccessory) {
            return;
        }
        if (device.deviceTypServer === 'listboxActuatorRollingShutter') {
            deviceAccessory = new SchellenbergShutter(this, this.config, homebridgeAccessory, device);
            this.log('created Shutter');
        } else if (device.deviceTypServer === 'textActuatorSingleDevicePushNotification') {
            return;
        } else if (device.deviceTypServer === 'textActuatorMultiDevicePushNotification') {
            return;
        } else if (device.deviceTypServer === 'sensorText') {
            return;
        }
        this.deviceAccessories.set(device.deviceID, deviceAccessory);
        this.homebridgeAccessories.set(uuid, deviceAccessory.homebridgeAccessory);
    }

    removeAccessory(homebridgeAccessory) {
        this.deviceAccessories.delete(homebridgeAccessory.deviceID);
        this.homebridgeAccessories.delete(homebridgeAccessory.deviceID);
        this.api.unregisterPlatformAccessories('homebridge-schellenberg-platform', 'SchellenbergPlatform', [homebridgeAccessory]);
    }


}

module.exports = SchellenbergPlatform;
