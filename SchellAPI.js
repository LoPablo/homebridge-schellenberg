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

    static checkAndParseMessage(log, data, callback, err) {
        if (err) {
            log.debug('Err input checkAndParse');
            callback(null, err);
        } else {
            if (data) {
                try {
                    let parse = JSON.parse(data);
                    if (parse.hasOwnProperty('responseCode')) {
                        if (parse.responseCode === 1) {
                            callback(parse, null);
                        } else if (parse.responseCode === 2) {

                        } else if (parse.responseCode === 2) {

                        }
                    } else {
                        callback(null, new Error('Data response was missing response Code'));
                    }
                } catch (e) {
                    callback(null, e);
                }
            } else {
                callback(null, new Error('Data response was empty but no Error occured'));
            }
        }
    }

    static tlsRequest(log, host, port, dataReq, callback) {
        let chunk = '';
        var timoutHandle = null;
        const options = {
            timeout: 10000,
            host: host,
            port: port,
            ca: fs.readFileSync('/Volumes/Daten/Dokumente/Projekte/homebridge-schellenberg/CA.pem'),
            rejectUnauthorized: false,
            checkServerIdentity: function (host, cert) {
            }
        };
        const socket = tls.connect(options, () => {
            if (!socket.authorized) {
                log.debug('client connected unauthorized');
            } else {
                log.debug('client connected authorized');
            }
        });
        socket.setEncoding('utf8');
        socket.on('data', (data) => {
            if (data.indexOf('\n') < 0) {
                clearTimeout(timoutHandle);
                chunk += data;
                timoutHandle = setTimeout(() => {
                    this.checkAndParseMessage(log, null, callback, new Error('Data timeout!' + options.timeout / 1000 + 'seconds expired'));
                    socket.destroy();
                }, options.timeout);
            } else {
                clearTimeout(timoutHandle);
                chunk += data;
                this.checkAndParseMessage(log, chunk, callback, null);
            }
        });
        socket.on('timeout', () => {
            this.checkAndParseMessage(log, null, callback, new Error('Connection timeout!' + options.timeout / 1000 + 'seconds expired'));
            socket.destroy();
        });
        socket.on('error', (err) => {
            this.checkAndParseMessage(log, null, callback, err);
        });
        socket.on('end', () => {
            log('End TLS connection');
        });
        socket.write(dataReq);
        log.debug('requested: ' + dataReq.toString());
        timoutHandle = setTimeout(() => {
            this.checkAndParseMessage(log, null, callback, new Error('Data timeout!' + options.timeout / 1000 + 'seconds expired'));
            socket.destroy();
        }, options.timeout);
        socket.write('\n');
    }

}

module.exports = SchellAPI;