'use strict';

const fs = require('fs');
const tls = require('tls');

class JSONSSLConnection {
    constructor(host, port, caPath, log) {
        this.supQueue = [];
        this.requestQueue = [];
        this.currentRequest = null;
        this.socket = null;
        if (log) {
            this.log = log;
        } else {
            this.log = console.log;
        }
        this.host = host;
        this.port = port;
        this.chunk = '';
        this.socketOptions = {
            timeout: 10000,
            host: host,
            port: port,
            ca: fs.readFileSync(caPath),
            rejectUnauthorized: false,
            checkServerIdentity: function (host, cert) {
            }
        };
        this.checkSocketConnection(() => {
            this.callNext();
        });
    }

    checkSocketConnection(callback) {
        const self = this;
        if (!this.socket) {
            this.log('no socket creating new one');
            this.socket = tls.connect(this.socketOptions, () => {
                if (!this.socket.authorized) {
                    this.log('client connected unauthorized');
                    this.socket.destroy();
                    throw new Error('TLS Socket could not connect, client connected unauthorized');
                } else {
                    this.log('client connected authorized');
                    if (callback) {
                        callback();
                    }
                }
            });
            this.socket.setEncoding('utf8');
            this.socket.on('data', (data) => {
                if (data.indexOf('\n') < 0) {
                    self.chunk += data;
                } else {
                    self.chunk += data;
                    self.returnAndCallNext(self.chunk, null);
                    self.chunk = '';
                }
            });
            this.socket.on('timeout', () => {

                this.socket.destroy();
            });
            this.socket.on('error', (err) => {
                this.returnAndCallNext(chunk, err);
            });
            this.socket.on('end', () => {
                this.requestQueue = [];
                this.answerQueue = [];
                this.socket.destroy();
                this.socket = null;
            });
        } else {
            if (callback) {
                callback();
            }
        }
    }


    returnAndCallNext(data) {
        if (this.supQueue.length > 0) {
            const nextCallback = this.supQueue.shift().promiseCallback;
            nextCallback(data);
        }
        this.currentRequest = null;
        this.callNext();
    }

    callNext() {
        this.log('callNext');
        const self = this;
        (async function loop() {
            self.log('loop created');
            while (self.requestQueue.length < 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            const nextRequest = self.requestQueue.shift();
            self.log(nextRequest);
            self.checkSocketConnection();
            self.startNextTimeout();
            self.currentRequest = nextRequest;
            self.socket.write(nextRequest);
            self.socket.write('\n');
            self.log('sent next Request')
        })();
    }

    startNextTimeout() {
        this.log('started next Timeout for ' + this.supQueue[0].request);
        this.supQueue[0].timeoutHandle = setTimeout(this.supQueue[0].timeoutCallback, 2000);
    }

    disconnectSocketConnection() {
        this.supQueue = [];
        this.requestQueue = [];
        this.socket.destroy();
        this.socket = null;
    }

    newRequest(reqData) {
        const self = this;
        this.requestQueue.push(reqData);
        this.log('pushed new Request');
        return new Promise((resolve, reject) => {
            const queobj = {
                'request': reqData,
                'promiseCallback': null,
                'timeoutCallback': null,
                'timeoutHandle': null
            };
            const promCallback = (data) => {
                clearTimeout(queobj.timeoutHandle);
                resolve(data);
            };
            const timeCallback = (data) => {
                self.log('timeout popped');
                self.chunk = '';
                self.supQueue.forEach(function (item, index, object) {
                    if (item === queobj) {
                        object.splice(index, 1);
                    }
                });
                reject('no answer 2 seconds after request');
            };
            queobj.promiseCallback = promCallback;
            queobj.timeoutCallback = timeCallback;
            self.supQueue.push(queobj);
        });
    }
}

module.exports = JSONSSLConnection;