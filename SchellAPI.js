const fs = require('fs');
const tls = require('tls');


class SchellAPI {
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

    static getDeviceSetMessage(session, deviceID, value) {
        const _result = {
            'sessionID': session,
            'command': 'setDeviceValue',
            'deviceID': deviceID,
            'value': value
        };
        return JSON.stringify(_result)
    }

    static checkAndParseMessage(log, data, callback) {
        if (data) {
            try {
                let parse = JSON.parse(data);
                if (parse.hasOwnProperty('responseCode')) {
                    if (parse.responseCode === 1) {
                        callback(parse);
                    }
                }
            } catch (err) {
                log('Error parsing JSON');
                callback(null);
            }
        } else {
            log('missing data');
            callback(null);
        }
    }

    static tlsRequest(log, host, port, dataReq, callback) {
        let chunk = '';
        const options = {
            host: host,
            port: port,
            ca: fs.readFileSync('/Volumes/Daten/Dokumente/Projekte/homebridge-schellenberg/CA.pem'),
            rejectUnauthorized: false,
            checkServerIdentity: function (host, cert) {
            }
        };
        const socket = tls.connect(options, () => {
            if (!socket.authorized) {
                log('client connected unauthorized');
            }
        });
        socket.setEncoding('utf8');
        socket.on('data', (data) => {
            if (data.indexOf('\n') < 0) {
                chunk += data;
            } else {
                chunk += data;
                this.checkAndParseMessage(log, chunk, callback);
            }
        });
        socket.on('error', (err) => {
            callback(null);
        });
        socket.on('end', () => {
            log('End TLS connection');
        });
        socket.write(dataReq);
        socket.write('\n');
    }

}

module.exports = SchellAPI;