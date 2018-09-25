'use strict';

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

const SchellAPI = require("./SchellAPI");


const getOrAddCharacteristic = (service, characteristic) => {
    return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
};

class SchellenbergShutter {
    constructor(platform, config, homebridgeAccessory, inconf) {
        let self = this;
        this.platform = platform;
        PlatformAccessory = platform.api.platformAccessory;
        Accessory = platform.api.hap.Accessory;
        Service = platform.api.hap.Service;
        Characteristic = platform.api.hap.Characteristic;
        UUIDGen = platform.api.hap.uuid;

        this.log = platform.log;
        this.config = config;
        this.homebridgeAccessory = homebridgeAccessory;
        this.inconf = inconf;
        this.runStepShutterTime = 300;
        this.localInterval = null;
        this.targetPosition = 100;
        this.currentPosition = 100;
        this.positionState = 0;

        if (!this.homebridgeAccessory) {
            this.log.debug('Creating new Accessory ');
            this.homebridgeAccessory = new PlatformAccessory(inconf.deviceName, UUIDGen.generate(inconf.deviceID.toString()), Accessory.Categories.WINDOW_COVERING);
            platform.registerPlatformAccessory(this.homebridgeAccessory);
        } else {
            this.log.debug('Existing Accessory found');
            this.homebridgeAccessory.displayName = inconf.deviceName;
        }

        this.service = this.homebridgeAccessory.getService(Service.WindowCovering);
        if (!this.service) {
            this.service = this.homebridgeAccessory.addService(Service.WindowCovering, inconf.deviceName);
        } else {
            this.service.setCharacteristic(Characteristic.Name, inconf.deviceName);
        }

        this.infoService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
        this.infoService
            .setCharacteristic(Characteristic.Name, inconf.deviceName)
            .setCharacteristic(Characteristic.Manufacturer, inconf.manufacturer)
            .setCharacteristic(Characteristic.Model, inconf.deviceDesignation.replace('${', '').replace('}', ''))
            .setCharacteristic(Characteristic.SerialNumber, inconf.deviceID);

        this.homebridgeAccessory.on('identify', (paired, callback) => {
            this.log('iidi');
            callback();
        });

        getOrAddCharacteristic(this.service, Characteristic.CurrentPosition)
            .on('get', (callback) => {
                this.log("getCurrentPosition:" + this.currentPosition);
                callback(null, this.currentPosition);
            })
            .on('set', (value, callback) => {
                this.log("setCurrentPosition: to " + value);
                callback(null, this.currentPosition);
            });

        getOrAddCharacteristic(this.service, Characteristic.TargetPosition)
            .on('get', (callback) => {
                this.log("getTargetPosition:" + this.currentPosition);
                callback(null, this.currentPosition);
            })
            .on('set', (value, callback) => {
                this.log("setTargetPosition: to " + value);
                this.targetPosition = value;
                if (this.localInterval) {
                    clearInterval(this.localInterval);
                }
                this.localInterval = this.shutterDrive();
                callback(null, this.currentPosition);
            })

    }

    shutterDrive() {
        return setInterval(() => {
            let self = this;
            var preState = this.positionState;
            this.log('preState:' + preState);
            if (this.targetPosition < this.currentPosition || this.targetPosition === 0) {
                this.positionState = 2;

                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
            } else if (this.targetPosition > this.currentPosition || this.targetPosition === 100) {
                this.positionState = 1;

                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
            } else if (this.targetPosition === this.currentPosition) {
                this.positionState = 0;
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
            }
            if (preState !== this.positionState) {
                this.log('newState:' + this.positionState);
                const req = SchellAPI.getDeviceSetMessage(this.platform.config.sessionId, this.inconf.deviceID, this.positionState.toString());
                SchellAPI.tlsRequest(this.log, this.config.host, this.config.port, req, (error, data) => {
                    if (!error) {
                        if (self.positionState === 2) {
                            self.currentPosition -= 1;
                        } else if (self.positionState === 1) {
                            self.currentPosition += 1;
                        }
                        self.service.setCharacteristic(Characteristic.CurrentPosition, self.currentPosition);
                        if (self.positionState === 0) {
                            clearInterval(self.localInterval);
                        } else if ((self.currentPosition === self.targetPosition && self.targetPosition === 100) || (self.currentPosition === self.targetPosition && self.targetPosition === 0)) {
                            clearInterval(self.localInterval);
                        } else {
                            self.log('still running');
                        }
                    } else {
                        self.log(error);
                    }
                });
            }
        }, this.runStepShutterTime);
    }
}

module.exports = SchellenbergShutter;
