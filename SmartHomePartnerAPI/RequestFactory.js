class RequestFactory {

    static getAllNewInfosMessage(session, timestamp, compatConfigVersion, translationVersion) {
        const _result = {
            'sessionID': session,
            'command': 'getAllNewInfos',
            'timestamp': timestamp,
            'compatibilityConfigurationVersion': compatConfigVersion,
            'languageTranslationVersion': translationVersion
        };
        return JSON.stringify(_result);
    }

    static getSetDeviceValueMessage(session, deviceID, value) {
        const _result = {
            'sessionID': session,
            'command': 'setDeviceValue',
            'deviceID': deviceID,
            'value': value
        };
        return JSON.stringify(_result)
    }

    static getKeepAliveMessage() {
        const _result = {
            'command': 'keepalive'
        };
        return JSON.stringify(_result)
    }

    static getHeloMessage(userName) {
        const _result = {
            'command': 'helo',
            'username': userName
        };
        return JSON.stringify(_result)
    }

    static getloginMessage(userName, digest, cSymbol, shcVersion, shApiVersion) {
        const _result = {
            'command': 'login',
            'username': userName,
            'digest': digest,
            'cSymbol': cSymbol,
            'shcVersion': shcVersion,
            'shApiVersion': shApiVersion,
        };
        return JSON.stringify(_result)
    }

    static getLogoutMessage(session) {
        const _result = {
            'sessionID': session,
            'command': 'logout'
        };
        return JSON.stringify(_result)
    }
}

module.exports = RequestFactory;
