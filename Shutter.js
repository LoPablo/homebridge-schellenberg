let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;


const getOrAddCharacteristic = (service, characteristic) => {
    return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
};


class SchellenbergShutter {
    constructor(platform, platformConfig, homebridgeAccessory, inDeviceId) {
        let self = this;
        this.platform = platform;

        PlatformAccessory = platform.api.platformAccessory;
        Accessory = platform.api.hap.Accessory;
        Service = platform.api.hap.Service;
        Characteristic = platform.api.hap.Characteristic;
        UUIDGen = platform.api.hap.uuid;

        this.log = platform.log;
        this.sApi = platform.sApi;
        this.platformConfig = platformConfig;
        this.homebridgeAccessory = homebridgeAccessory;

        this.deviceId = inDeviceId;
        this.runStepShutterTime = 300;

        this.configureRollingTime();
        this.localInterval = null;

        let startPosition = this.sApi.getDeviceValue(this.deviceId);

        this.log('startPosition' + startPosition);


        if (startPosition.value === 0) {
            //TODO: Implement opening shutters
        } else if (startPosition.value === 1) {
            this.targetPosition = 100;
            this.currentPosition = 100;
        } else if (startPosition.value === 2) {
            this.targetPosition = 0;
            this.currentPosition = 0;
        }
        this.positionState = 0;

        if (!this.homebridgeAccessory) {
            this.log.debug('Creating new Accessory ');
            this.homebridgeAccessory = new PlatformAccessory(startInfo.deviceName, UUIDGen.generate(startInfo.deviceID.toString()), Accessory.Categories.WINDOW_COVERING);
            platform.registerPlatformAccessory(this.homebridgeAccessory);
        } else {
            this.log.debug('Existing Accessory found');
            this.homebridgeAccessory.displayName = startInfo.deviceName;
        }

        this.initServices();
    }

    initServices() {
        let self = this;
        let startInfo = this.sApi.getDevice(this.deviceId);
        this.log('Device Info\n' + startInfo);

        this.service = this.homebridgeAccessory.getService(Service.WindowCovering);
        if (!this.service) {
            this.service = this.homebridgeAccessory.addService(Service.WindowCovering, startInfo.deviceName);
        } else {
            this.service.setCharacteristic(Characteristic.Name, startInfo.deviceName);
        }

        this.infoService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
        this.infoService
            .setCharacteristic(Characteristic.Name, startInfo.deviceName)
            .setCharacteristic(Characteristic.Manufacturer, startInfo.manufacturer)
            .setCharacteristic(Characteristic.Model, startInfo.deviceDesignation.replace('${', '').replace('}', ''))
            .setCharacteristic(Characteristic.SerialNumber, startInfo.deviceID);

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
                }
                this.localInterval = this.shutterDrive();
                callback(null, this.currentPosition);
            });

        this.homebridgeAccessory.on('identify', (paired, callback) => {
            this.log('iidi');
            callback();
        });

        this.sApi.on('newDeviceValue', (e) => {
            if (e.deviceID === this.deviceId) {
                if (e.value === 0) {
                    clearInterval(self.localInterval);
                    this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
                    this.targetPosition = this.currentPosition;
                } else if (e.value === 1) {
                    this.service.setCharacteristic(Characteristic.TargetPosition, 100);
                } else if (e.value === 2) {
                    this.service.setCharacteristic(Characteristic.TargetPosition, 0);
                }
            }
        });


    }

    shutterDrive() {
        return setInterval(() => {
            let self = this;
            let preState = this.positionState;
            if (this.targetPosition < this.currentPosition || this.targetPosition === 0) {
                this.positionState = 2;
                this.sApi.storeDeviceValue(this.deviceId, 2, true);
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
            } else if (this.targetPosition > this.currentPosition || this.targetPosition === 100) {
                this.positionState = 1;
                this.sApi.storeDeviceValue(this.deviceId, 1, true);
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
            } else if (this.targetPosition === this.currentPosition) {
                this.positionState = 0;
                this.service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
            }
            if (preState !== this.positionState) {
                this.sApi.setDeviceValue(this.deviceId, this.positionState);
            }
            if ((self.positionState === 0) || (self.currentPosition === self.targetPosition && self.targetPosition === 100) || (self.currentPosition === self.targetPosition && self.targetPosition === 0)) {
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

    configureRollingTime() {
        if (this.platformConfig.hasOwnProperty('rollingTimes')) {
            for (let j = 0; j < this.platformConfig.rollingTimes.length; j++) {
                const currentTime = this.platformConfig.rollingTimes[j];
                if (currentTime.hasOwnProperty('deviceID') && currentTime.hasOwnProperty('time')) {
                    if (currentTime.deviceID === this.deviceId) {
                        this.runStepShutterTime = currentTime.time;
                    }
                }
            }
        }
    }
}

module.exports = SchellenbergShutter;
