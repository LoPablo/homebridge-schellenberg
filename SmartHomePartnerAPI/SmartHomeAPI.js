const JSONSSLConnection = require("./JSONSSLConnection");
const RequestFactory = require("./RequestFactory");
const LoginHelper = require("./LoginHelper");

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


        this.sessionKey = null;
        this.SSLCon = null;
        this.keepAliveHandle = null;

    }

    login(callback) {
        const self = this;
        if (SSLCon) {
            this.log.debug('SSLCon already existing. Terminating and creating new one');
            this.SSLCon.disconnectSocketConnection();
            this.SSLCon = null;
        }
        this.SSLCon = new JSONSSLConnection(this.host, this.port, this.caPath, this.log);
        try {
            const req = RequestFactory.getHeloMessage(this.username);
            this.SSLCon.newRequest(req, (data) => {
                callback(data);
            });
        } catch (e) {

        }
    }

    getDevicesInfos() {

    }

    getDevice() {

    }

    startKeepAlive() {

    }

    stopKeepAlive() {

    }

}

module.exports = SmartHomeAPI;
