const SchellenbergShutter = require('./Shutter');
const SmartHomePartnerAPI = require("./SmartHomeAPI");


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
        //Homebridge
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
        this.api = new SmartHomePartnerAPI(this.config.host, this.config.port, this.config.username, this.config.password, this.config.caPath, 'D19015', '2.9.0', '2.9', this.log);
        api.eventEmitter.on('newDevice', (e) => {
            console.log('EventNewDevice: ' + e.deviceID);
        });
        api.login(() => {

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
