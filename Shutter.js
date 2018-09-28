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
        this.reachable = 0;
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
                callback(null, this.currentPosition);
            })
            .on('set', (value, callback) => {
                callback(null, this.currentPosition);
            });

        getOrAddCharacteristic(this.service, Characteristic.TargetPosition)
            .on('get', (callback) => {
                callback(null, this.currentPosition);
            })
            .on('set', (value, callback) => {
                this.targetPosition = value;
                if (this.localInterval) {
                    clearInterval(this.localInterval);
                    self.platform.refreshBlock = false;
                }
                this.localInterval = this.shutterDrive();
                callback(null, this.currentPosition);
            });

        getOrAddCharacteristic(this.service, Characteristic.StatusFault)
            .on('get', (callback) => {
                this.log('check reachi');
                callback(null, this.reachable);
            })
            .on('set', (value, callback) => {
                this.log('set reachi');
            });
    }

    shutterDrive() {
        return setInterval(() => {
            this.platform.refreshBlock = true;
            let self = this;
            const preState = this.positionState;
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
                const req = SchellAPI.getDeviceSetMessage(this.platform.config.sessionId, this.inconf.deviceID, this.positionState.toString());
                SchellAPI.tlsRequest(this.log, this.config.host, this.config.port, req, (error, data) => {

                });
            }
            if ((self.positionState === 0) || (self.currentPosition === self.targetPosition && self.targetPosition === 100) || (self.currentPosition === self.targetPosition && self.targetPosition === 0)) {
                self.platform.refreshBlock = false;
                clearInterval(self.localInterval);
            } else if (self.positionState === 2) {
                self.currentPosition -= 1;
            } else if (self.positionState === 1) {
                self.currentPosition += 1;
            } else {
                self.log('still running');
            }
            self.service.setCharacteristic(Characteristic.CurrentPosition, self.currentPosition);
        }, this.runStepShutterTime);
    }
}

module.exports = SchellenbergShutter;
