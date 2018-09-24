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
        return JSON.stringify(_result)
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

    static checkAndParseMessage(data, callback) {
        if (data) {
            try {
                let parse = JSON.parse(data);
                if (parse.hasOwnProperty('responseCode')) {
                    if (parse.responseCode === 1) {
                        callback(null, parse);
                    }
                }
            } catch (err) {
                callback(err, null);
            }
        } else {
            const err = new Error('missing data');
            callback(err, null);
        }
    }

    static tlsRequest(log, host, port, dataReq, callback) {
        let chunk = '';
        const options = {
            host: host,
            port: port,
            ca: fs.readFileSync('./CA.pem'),
            rejectUnauthorized: false,
            checkServerIdentity: function (host, cert) {
            }
        };
        const socket = tls.connect(options, () => {
            log('client connected', socket.authorized ? 'authorized' : 'unauthorized')
        });
        socket.setEncoding('utf8');
        socket.on('data', (data) => {
            if (data.indexOf('\n') < 0) {
                chunk += data;
            } else {
                chunk += data;
                this.checkAndParseMessage(chunk, callback);
            }
        });
        socket.on('error', (err) => {
            callback(err, null)
        });
        socket.on('end', () => {
            log('End TLS connection')
        });
        socket.write(dataReq);
        socket.write('\n');
    }

}

module.exports = SchellAPI;