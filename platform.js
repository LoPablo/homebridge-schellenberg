const SchellenbergShutter = require('./schellenbergShutter');
const SchellenbergApi = require('schellenbergapi');

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

        this.log = log;
        this.config = config;
        this.api = api;

        this.homebridgeAccessories = new Map();
        this.deviceAccessories = new Map();

        log('Init Platform');
        this.initPlatform();
    }


    initPlatform() {
        const platform = this;
        this.log(platform.config);
        SchellenbergApi.configureInstance(platform.config, platform.log.debug);
        this.sApi = SchellenbergApi.getInstance();
        this.sApi.on('newDI', (data) => {
            this.log.debug('new DeviceInfo %s', data);
            this.addAccessory(data);
        });
    }

    registerPlatformAccessory(platformAccessory) {
        this.api.registerPlatformAccessories('homebridge-schellenberg-platform', 'SchellenbergPlatform', [platformAccessory]);
    }

    configureAccessory(accessory) {
        this.log('Restoring device %s', accessory.UUID);
        this.homebridgeAccessories.set(accessory.UUID, accessory);
    }

    addAccessory(data) {
        let uuid = this.api.hap.uuid.generate(data.deviceID.toString());
        this.log.debug('new Accessory with uuid %s', uuid);
        let homebridgeAccessory = this.homebridgeAccessories.get(uuid);
        let deviceAccessory = this.deviceAccessories.get(data.deviceID);
        if (deviceAccessory) {
            return;
        }
        this.log.debug('new Accessory %s, %s', data.deviceTypServer, data.deviceID);
        if (data.deviceTypServer === 'listboxActuatorRollingShutter') {
            deviceAccessory = new SchellenbergShutter(this, homebridgeAccessory, data);
            this.deviceAccessories.set(data.deviceID, deviceAccessory);
            this.homebridgeAccessories.set(uuid, deviceAccessory.homebridgeAccessory);
        } else if (data.deviceTypServer === 'textActuatorSingleDevicePushNotification') {
            return;
        } else if (data.deviceTypServer === 'textActuatorMultiDevicePushNotification') {
            return;
        } else if (data.deviceTypServer === 'sensorText') {
            return;
        }
    }

    removeAccessory(homebridgeAccessory) {
        this.deviceAccessories.delete(homebridgeAccessory.deviceID);
        this.homebridgeAccessories.delete(homebridgeAccessory.deviceID);
        this.api.unregisterPlatformAccessories('homebridge-schellenberg-platform', 'SchellenbergPlatform', [homebridgeAccessory]);
    }


}

module.exports = SchellenbergPlatform;
