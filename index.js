'use strict';

const SchellenbergPlatform = require('./Platform');

module.exports = function (homebridge) {
    homebridge.registerPlatform('homebridge-schellenberg-platform', 'SchellenbergPlatform', SchellenbergPlatform, true)
}

