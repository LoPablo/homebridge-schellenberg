let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

const getOrAddCharacteristic = (service, characteristic) => {
    return service.getCharacteristic(characteristic) || service.addCharacteristic(characteristic);
};

class SchellenbergShutter {
    constructor(platform, homebridgeAccessory, inDevice) {

        this.platform = platform;

        PlatformAccessory = platform.api.platformAccessory;
        Accessory = platform.api.hap.Accessory;
        Service = platform.api.hap.Service;
        Characteristic = platform.api.hap.Characteristic;
        UUIDGen = platform.api.hap.uuid;

        this.log = platform.log;
        this.log.debug('Log test from new Accessory');
        this.homebridgeAccessory = homebridgeAccessory;

        this.device = inDevice;
        this.runStepShutterTime = 300;
        this.cameFromApi = false;
        this.ignoreNext = false;
        this.configureRollingTime();
        this.localInterval = null;
        this.currentPosition = 0;
        this.targetPosition = 0;
        this.hadFirstPosition = false;
        this.positionState = 0;
        if (!this.homebridgeAccessory) {
            this.log.debug('Creating new Accessory %s', this.device.deviceName);
            this.homebridgeAccessory = new PlatformAccessory(this.device.deviceName, UUIDGen.generate(this.device.deviceID.toString()), Accessory.Categories.WINDOW_COVERING);
            platform.registerPlatformAccessory(this.homebridgeAccessory);
        } else {
            this.log.debug('Existing Accessory found');
            this.homebridgeAccessory.displayName = this.device.deviceName;
        }
        this.initServices();
    }

    initServices() {
        let self = this;

        this.service = this.homebridgeAccessory.getService(Service.WindowCovering);
        if (!this.service) {
            this.service = this.homebridgeAccessory.addService(Service.WindowCovering, this.device.deviceName);
        } else {
            this.service.setCharacteristic(Characteristic.Name, this.device.deviceName);
        }

        this.infoService = this.homebridgeAccessory.getService(Service.AccessoryInformation);
        this.infoService
        .setCharacteristic(Characteristic.Name, this.device.deviceName)
        .setCharacteristic(Characteristic.Manufacturer, this.device.manufacturer)
        .setCharacteristic(Characteristic.Model, this.device.manufacturer.deviceDesignation)
        .setCharacteristic(Characteristic.SerialNumber, this.device.deviceID);

        getOrAddCharacteristic(this.service, Characteristic.CurrentPosition)
        .on('get', (callback) => {
            callback(null, this.currentPosition);
        })
        .on('set', (value, callback) => {
            this.log.debug('New CurrentPosition %s for deviceID %s', this.currentPosition, this.device.deviceID);
            callback(null, this.currentPosition);
        });

        getOrAddCharacteristic(this.service, Characteristic.TargetPosition)
        .on('get', (callback) => {
            callback(null, this.currentPosition);
        })
        .on('set', (value, callback) => {
            this.targetPosition = value;
            if (!this.cameFromApi) {
                this.log.debug('New TargetPosition %s for deviceID %s from Homekit, Ignoring next newDeviceValue', this.targetPosition, this.device.deviceID);
                this.ignoreNext=true;
            } else {
                this.log.debug('New TargetPosition %s for deviceID %s from API', this.targetPosition, this.device.deviceID);
                this.cameFromApi = false;
            }
            if (this.localInterval) {
                clearInterval(this.localInterval);
            }
            this.localInterval = this.shutterDrive();
            callback(null, this.currentPosition);
        });

        this.homebridgeAccessory.on('identify', (paired, callback) => {
            this.log('Identifying Shutter ith deviceID %s', this.device.deviceID);
            this.log.debug(this.device);
            callback();
        });

        this.platform.sApi.on('newDV', (data) => {
            if (data.deviceID && (data.value || data.value===0) && data.deviceID == this.device.deviceID) {
                if (this.ignoreNext){
                    this.log.debug('NewDeviceValue %s from Api for deviceID %s IGNORED because of HomeKit', data.value, data.deviceID);
                }else{
                    if (this.hadFirstPosition) {
                        this.log.debug('NewDeviceValue %s from Api for deviceID %s', data.value, data.deviceID);
                        if (data.value === 0) {
                            this.log.debug('Penis');
                            this.cameFromApi = true;
                            this.service.setCharacteristic(Characteristic.TargetPosition, this.currentPosition);
                        } else if (data.value === 1) {
                            this.cameFromApi = true;
                            this.service.setCharacteristic(Characteristic.TargetPosition, 100);
                        } else if (data.value === 2) {
                            this.cameFromApi = true;
                            this.service.setCharacteristic(Characteristic.TargetPosition, 0);
                        }
                    } else {
                        if (data.value === 0) {
                            this.targetPosition = 50;
                            this.currentPosition = 50;
                        } else if (data.value === 1) {
                            this.targetPosition = 100;
                            this.currentPosition = 100;
                        } else if (data.value === 2) {
                            this.targetPosition = 0;
                            this.currentPosition = 0;
                        }
                        this.log.debug('DeviceID %s had first position %s', this.device.deviceID, this.currentPosition);
                        this.hadFirstPosition = true;
                    }
                }
            } else{
                if (data.deviceID === this.device.deviceID) {
                    this.log.debug('Missing newDV handle %s', JSON.stringify(data));
                }
            }
        });
        this.platform.sApi.on('newDI', (data) => {
            if (data.deviceID && data.value && data.deviceID === this.device.deviceID) {
                this.device = data;
                this.service.setCharacteristic(Characteristic.Name, this.device.deviceName);
                this.infoService.setCharacteristic(Characteristic.Name, this.device.deviceName);
                this.infoService.setCharacteristic(Characteristic.Manufacturer, this.device.manufacturer);
                this.infoService.setCharacteristic(Characteristic.Model, this.device.manufacturer.deviceDesignation);
                this.infoService.setCharacteristic(Characteristic.SerialNumber, this.device.deviceID);
            }
        });
    }

    shutterDrive() {
        this.log.debug('New shutterDrive for %s to targetPosition %s from currentPositions', this.device.deviceID, this.targetPosition, this.currentPosition);
        return setInterval(() => {
            let self = this;
            let preState = this.positionState;
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
                this.platform.sApi.handler.setDeviceValue(this.device.deviceID, this.positionState)
                .then(() => {
                    this.log.debug('ShutterDrive chose %s as direction, preState was %s', this.positionState, preState);
                })
                .catch((err) => {
                    this.log.debug('ShutterDrive set device value had error %s', err);
                    clearInterval(this.localInterval);
                });
            }
            if ((self.positionState === 0) || (self.currentPosition === self.targetPosition && self.targetPosition === 100) || (self.currentPosition === self.targetPosition && self.targetPosition === 0)) {
                clearInterval(self.localInterval);
            } else if (self.positionState === 2) {
                self.currentPosition -= 1;
            } else if (self.positionState === 1) {
                self.currentPosition += 1;
            }
            self.service.setCharacteristic(Characteristic.CurrentPosition, self.currentPosition);
        }, this.runStepShutterTime);
    }

    configureRollingTime() {
        if (this.platform.config.rollingTimes) {
            for (let j = 0; j < this.platform.config.rollingTimes.length; j++) {
                const currentTime = this.platform.config.rollingTimes[j];
                if (currentTime.deviceID && currentTime.time) {
                    if (currentTime.deviceID === this.device.deviceID) {
                        this.log.debug('New RollingTime for deviceID %s is %s', this.device.deviceID, currentTime.time);
                        this.runStepShutterTime = currentTime.time / 100;
                    }
                }
            }
        }
    }
}

module.exports = SchellenbergShutter;
