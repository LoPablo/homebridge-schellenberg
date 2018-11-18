'use strict';

const fs = require('fs');
const tls = require('tls');
const events = require('events');
const aLock = require('async-lock');

class JSONSSLConnection extends events {
    constructor(host, port, caPath, log) {
        super();
        this.lock = new aLock();
        this.currentRequest = null;
        this.resolveQueue = [];
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
        this.keepAliveHandle = null;
    }

    checkSocketConnection() {
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
                }
            });
            this.socket.setEncoding('utf8');
            this.socket.on('data', (data) => {
                if (data.indexOf('\n') < 0) {
                    self.chunk += data;
                } else {
                    self.chunk += data;

                    if (self.resolveQueue.length === 0) {
                        self.log(self.chunk);
                        self.emit('data', self.chunk);
                    } else {
                        self.resolveQueue.shift()(self.chunk);
                    }
                    self.chunk = '';
                }
            });
            this.socket.on('timeout', () => {
                setTimeout(() => {
                    self.renewSocket()
                }, 0);
            });
            this.socket.on('error', (err) => {
                setTimeout(() => {
                    self.renewSocket()
                }, 0);
            });
            this.socket.on('end', () => {
                setTimeout(() => {
                    self.renewSocket()
                }, 0);
            });
            this.socket.on('close', () => {
                setTimeout(() => {
                    self.renewSocket()
                }, 0);
            });
        }
    }

    renewSocket() {
        this.stopKeepAlive();
        this.socket.destroy();
        this.socket = null;
        this.checkSocketConnection();
        this.emit('newSocket');
    }

    newSendOnlyRequest(reqData) {
        this.lock.acquire('send', (done) => {
            this.checkSocketConnection();
            this.socket.write(reqData);
            this.socket.write('\n');
            this.log(reqData);
            done();
        });

    }

    startKeepAlive(aliveMessage) {
        this.keepAliveHandle = setInterval(() => {
            this.checkSocketConnection();
            this.newSendOnlyRequest(aliveMessage);
        }, 2000);
    }

    stopKeepAlive() {
        clearInterval(this.keepAliveHandle);
    }

    newSendRecieveRequest(reqData, callback) {
        this.lock.acquire('send', (done) => {
            this.checkSocketConnection();
            this.socket.write(reqData);
            this.socket.write('\n');
            this.log(reqData);
            this.resolveQueue.push((data) => {
                if (callback) callback(data);
                done();
            });
        });
    }
}

module.exports = JSONSSLConnection;