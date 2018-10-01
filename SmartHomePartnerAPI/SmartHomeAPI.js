const JSONSSLConnection = require("./JSONSSLConnection");
const RequestFactory = require("./RequestFactory");
const LoginHelper = require("./LoginHelper");
const AnswerInterpreter = require("./AnswerInterpreter");
const SmartHomeData = require("./SmartHomeData");

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

        this.timestamp = 0;
        this.languageTranslationVersion = 0;
        this.compatibilityConfigurationVersion = 0;

        if (log) {
            this.log = log;
        } else {
            this.log = console.log;
        }

        this.dataStore = null;
        this.interpreter = new AnswerInterpreter(this.dataStore);
        this.deviceInfo = null;
        this.macAddress = null;
        this.localServerTime = null;
        this.shsVersion = null;
        this.sessionKey = null;
        this.SSLCon = null;
        this.keepAliveHandle = null;

    }

    login(callback) {
        const self = this;
        if (this.SSLCon) {
            this.log.debug('SSLCon already existing. Terminating and creating new one');
            this.SSLCon.disconnectSocketConnection();
            this.SSLCon = null;
        }
        this.SSLCon = new JSONSSLConnection(this.host, this.port, this.caPath, this.log);
        try {
            const req = RequestFactory.getHeloMessage(this.username);
            this.SSLCon.newRequest(req)
                .then((data) => {
                    let heloParse = self.interpreter.parseHelo(data);
                    return heloParse;
                }).catch((err) => {

            })
                .then((heloResponse) => {
                    let digest = LoginHelper.calculateDigest(self.password, heloResponse.salt, heloResponse.sessionSalt);
                    let nreq = RequestFactory.getLoginMessage(self.username, digest, self.cSymbol, self.shcVersion, self.shAPIVersion);
                    return self.SSLCon.newRequest(nreq);
                }).catch((err) => {

            })
                .then((loginResponse) => {
                    self.log(loginResponse);
                    let loginParse = self.interpreter.parseLogin(loginResponse);
                    self.log(loginParse);
                    self.deviceInfo = {
                        "hardware": loginParse.hardware,
                        "macAddress": loginParse.MacAddress,
                        "shsVersion": loginParse.shsVersion
                    };
                    self.localServerTime = loginParse.localSHServerTime;
                    self.sessionKey = loginParse.sessionID;
                }).catch((err) => {

            }).then(() => {
                // self.log(self);
            })
        } catch (e) {
            this.log(e);
        }
    }

    getDevicesInfos() {

    }

    getDevice(deviceID) {
        return this.dataStore.getDevice(deviceID);
    }


}

module.exports = SmartHomeAPI;
