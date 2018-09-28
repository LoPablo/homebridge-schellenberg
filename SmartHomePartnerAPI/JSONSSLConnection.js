'use strict';

const fs = require('fs');
const tls = require('tls');

class JSONSSLConnection {
    constructor(log, host, port, caPath) {
        this.answerQueue = [];
        this.requestQueue = [];
        this.socket = null;
        this.log = log;
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

    async checkSocketConnection(callback) {
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
                    this.returnAndCallNext(this.chunk, null);
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
            });
        } else {
            if (callback) {
                callback();
            }
        }
    }

    returnAndCallNext(data) {
        if (this.answerQueue.length > 0) {
            const nextCallback = this.answerQueue.shift();
            nextCallback(data);
        }
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
            self.socket.write(nextRequest);
            self.socket.write('\n');
            self.log('sent next Request')
        })();
    }

    disconnectSocketConnection() {
        this.requestQueue = [];
        this.answerQueue = [];
        this.socket.destroy();
        this.socket = null;
    }

    newRequest(reqData, callback) {
        this.answerQueue.push(callback);
        this.requestQueue.push(reqData);
        this.log('pushed new Request');
    }
}

module.exports = JSONSSLConnection;