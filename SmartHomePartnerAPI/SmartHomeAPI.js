const JSONSSLConnection = require("./JSONSSLConnection");
const RequestFactory = require("./RequestFactory");
const LoginHelper = require("./LoginHelper");
const AnswerInterpreter = require("./AnswerInterpreter");
const SmartHomeDataStorage = require("./SmartHomeDataStorage");
const events = require('events');

class SmartHomeAPI extends events {
    constructor(host, port, username, password, caPath, cSymbol, shcVersion, shApiVersion, log) {
        super();
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.caPath = caPath;
        this.cSymbol = cSymbol;
        this.shcVersion = shcVersion;
        this.shAPIVersion = shApiVersion;

        if (log) {
            this.log = log;
        } else {
            this.log = console.log;
        }

        this.dataStore = new SmartHomeDataStorage(this);
        this.interpreter = new AnswerInterpreter(this.dataStore);
        this.deviceInfo = null;
        this.localServerTimeLogin = null;
        this.shsVersion = null;
        this.sessionKey = null;
        this.SSLCon = null;

    }

    login(callback) {
        const self = this;
        if (this.SSLCon) {
            this.log.debug('SSLCon already existing. Terminating and creating new one');
            this.SSLCon.renewSocket();
            this.SSLCon = null;
        }
        this.SSLCon = new JSONSSLConnection(this.host, this.port, this.caPath, this.log);
        this.SSLCon.on('data', (data) => {
            this.interpreter.parseNewData(data);
        });
        this.SSLCon.on('newSocket', () => {
            this.login();
        });
        let req = RequestFactory.getHeloMessage(this.username);
        this.SSLCon.newSendRecieveRequest(req, (data) => {
            let heloResponse = this.interpreter.parseHelo(data);
            let digest = LoginHelper.calculateDigest(self.password, heloResponse.salt, heloResponse.sessionSalt);
            let neqReq = RequestFactory.getLoginMessage(self.username, digest, self.cSymbol, self.shcVersion, self.shAPIVersion);
            self.SSLCon.newSendRecieveRequest(neqReq, (data) => {
                let loginParse = self.interpreter.parseLogin(data);
                this.deviceInfo = {
                    "hardware": loginParse.hardware,
                    "macAddress": loginParse.MacAddress,
                    "shsVersion": loginParse.shsVersion
                };
                this.localServerTimeLogin = loginParse.localSHServerTime;
                this.sessionKey = loginParse.sessionID;
                let infoReq = RequestFactory.getAllNewInfosMessage(self.sessionKey, 0, 0, 0);
                self.SSLCon.newSendRecieveRequest(infoReq, (data) => {
                    this.interpreter.parseAndStoreNewInfos(data);
                    this.SSLCon.startKeepAlive(RequestFactory.getKeepAliveMessage());
                    this.dataStore.initFinished = true;
                    if (callback) {
                        setTimeout(callback, 1000);
                    }
                });
            });
        });

    }

    getDevice(deviceID) {
        return this.dataStore.getDevice(deviceID);
    }

    getDeviceValue(deviceID) {
        this.log(this.dataStore.deviceValues);
        this.log(deviceID);
        return this.dataStore.getDeviceValue(deviceID);
    }

    getAllDevices() {
        return this.dataStore.devices;
    }

    setDeviceValue(deviceID, value, callback) {
        this.SSLCon.newSendRecieveRequest(RequestFactory.getSetDeviceValueMessage(this.sessionKey, deviceID, value), callback);
    }

    storeDeviceValue(deviceID, value, noEmit) {
        this.dataStore.setDeviceValue(deviceID, value, noEmit);
    }

}

module.exports = SmartHomeAPI;
