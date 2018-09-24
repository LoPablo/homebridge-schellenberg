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
            var preState = this.positionState;
            this.log('preState:' + preState);
            if (this.targetPosition < this.currentPosition || this.targetPosition === 0) {
                this.positionState = 2;
                this.currentPosition -= 1;
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
            } else if (this.targetPosition > this.currentPosition || this.targetPosition === 100) {
                this.positionState = 1;
                this.currentPosition += 1;
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
            } else if (this.targetPosition === this.currentPosition) {
                this.positionState = 0;
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
            }
            if (preState !== this.positionState) {
                this.log('newState:' + this.positionState);
                var req = SchellAPI.getDeviceSetMessage(this.platform.config.sessionId, this.inconf.deviceID, this.positionState.toString());
                SchellAPI.tlsRequest(this.log, this.config.host, this.config.port, req, (data) => {
                    this.log(data);
                });
            }
            this.service.setCharacteristic(Characteristic.CurrentPosition, this.currentPosition);
            if (this.positionState === 0) {
                this.log('exit with state');
                clearInterval(this.localInterval);
            } else if ((this.currentPosition === this.targetPosition && this.targetPosition === 100) || (this.currentPosition === this.targetPosition && this.targetPosition === 0)) {
                this.log('exit stateless');
                clearInterval(this.localInterval);
            } else {
                this.log('still running');
            }
        }, this.runStepShutterTime);


    }
}

module.exports = SchellenbergShutter;
