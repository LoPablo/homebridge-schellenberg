'use strict';

const SchellenbergShutter = require('./Shutter');
const SchellAPI = require("./SchellAPI");


class SchellenbergPlatform {
    constructor(log, config, api) {
        let self = this;
        if (!api || !config) return;
        log('SchellenbergPlatform');
        this.log = log;
        this.config = config;
        this.accessories = [];
        this.api = api;
        this.homebridgeAccessories = new Map();
        this.deviceAccessories = new Map();

        this.log('Fetching Schellenberg devices.');
        var req = SchellAPI.getAllNewInfosMessage(this.config.sessionId, 0, 0, 0);
        SchellAPI.tlsRequest(this.log, this.config.host, this.config.port, req, (data) => {
            if (data.hasOwnProperty('response')) {
                if (data.response.hasOwnProperty('newDeviceInfos')) {
                    for (let j = 0; j < data.response.newDeviceInfos.length; j++) {
                        const accessoryResult = data.response.newDeviceInfos[j];
                        self.addAccessory(accessoryResult);
                    }
                } else {

                }
            } else {

            }

        });
    }

    registerPlatformAccessory(platformAccessory) {
        this.api.registerPlatformAccessories('homebridge-schellenberg-platform', 'SchellenbergPlatform', [platformAccessory]);
    }

    configureAccessory(accessory) {
        this.homebridgeAccessories.set(accessory.UUID, accessory);
    }

    addAccessory(device) {
        let uuid = this.api.hap.uuid.generate(device.deviceID.toString());
        let homebridgeAccessory = this.homebridgeAccessories.get(uuid);
        let deviceAccessory = this.deviceAccessories.get(device.deviceID);


        if (deviceAccessory) {
            return;
        }
        this.log(device.deviceTypServer);
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
