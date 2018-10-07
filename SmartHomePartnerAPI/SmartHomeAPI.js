const JSONSSLConnection = require("./JSONSSLConnection");
const RequestFactory = require("./RequestFactory");
const LoginHelper = require("./LoginHelper");
const AnswerInterpreter = require("./AnswerInterpreter");
const SmartHomeDataStorage = require("./SmartHomeDataStorage");
const events = require('events');

class SmartHomeAPI {
    constructor(host, port, username, password, caPath, cSymbol, shcVersion, shApiVersion, log) {
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

        this.eventEmitter = new events.EventEmitter();
        this.dataStore = new SmartHomeDataStorage(this.eventEmitter);
        this.interpreter = new AnswerInterpreter(this.dataStore);
        this.deviceInfo = null;
        this.localServerTimeLogin = null;
        this.shsVersion = null;
        this.sessionKey = null;
        this.SSLCon = null;
        this.refreshHandle = null;
    }

    login(callback) {
        const self = this;
        if (this.SSLCon) {
            this.log.debug('SSLCon already existing. Terminating and creating new one');
            this.SSLCon.disconnectSocketConnection();
            this.SSLCon = null;
        }
        this.SSLCon = new JSONSSLConnection(this.host, this.port, this.caPath, this.log);

        let req = RequestFactory.getHeloMessage(this.username);
        this.SSLCon.newRequest(req)
            .then((data) => {
                return self.interpreter.parseHelo(data);
            }).catch((err) => {

            })
            .then((heloResponse) => {
                let digest = LoginHelper.calculateDigest(self.password, heloResponse.salt, heloResponse.sessionSalt);
                let neqReq = RequestFactory.getLoginMessage(self.username, digest, self.cSymbol, self.shcVersion, self.shAPIVersion);
                return self.SSLCon.newRequest(neqReq);
            }).catch((err) => {

            })
            .then((loginResponse) => {
                let loginParse = self.interpreter.parseLogin(loginResponse);
                self.deviceInfo = {
                    "hardware": loginParse.hardware,
                    "macAddress": loginParse.MacAddress,
                    "shsVersion": loginParse.shsVersion
                };
                self.localServerTimeLogin = loginParse.localSHServerTime;
                self.sessionKey = loginParse.sessionID;
                self.refreshHandle = setInterval(() => {
                    self.refreshDevices();
                }, 2000);
            }).catch((err) => {
            console.log(err);
        });
    }

    refreshDevices() {
        const self = this;
        if (!this.SSLCon) {
            clearInterval(this.refreshHandle);
            throw new Error('Missing Connection');
        }
        let req = RequestFactory.getAllNewInfosMessage(this.sessionKey, this.dataStore.timestamp, this.dataStore.compatibilityConfigurationVersion, this.dataStore.languageTranslationVersion);
        this.SSLCon.newRequest(req)
            .then((data) => {
                self.interpreter.parseAndStoreNewInfos(data);
            })
            .catch((err) => {
                self.log(err);
            });
    }

    getDevice(deviceID) {
        return this.dataStore.getDevice(deviceID);
    }


}

module.exports = SmartHomeAPI;
