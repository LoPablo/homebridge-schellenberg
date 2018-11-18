const SchellenbergShutter = require('./Shutter');
const SmartHomePartnerAPI = require("./SmartHomePartnerAPI/SmartHomeAPI");

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
        this.homebridgeAccessories = new Map();
        this.deviceAccessories = new Map();
        this.sApi = new SmartHomePartnerAPI(this.config.host, this.config.port, this.config.username, this.config.password, this.config.caPath, 'D19015', '2.9.0', '2.9', this.log);
        this.sApi.on('newDevice', (e) => {
            this.addAccessory(self.sApi.getDevice(e));
        });

        this.sApi.login(() => {
            let inDev = this.sApi.getAllDevices();
            inDev.forEach((value, key) => {
                self.log(key);
                this.addAccessory(self.sApi.getDevice(key));
            })

        });

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
            deviceAccessory = new SchellenbergShutter(this, this.config, homebridgeAccessory, device.deviceID);
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
