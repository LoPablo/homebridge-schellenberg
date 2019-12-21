
const SchellenbergPlatform = require('./platform');

module.exports = function (homebridge) {
    homebridge.registerPlatform('homebridge-schellenberg-platform', 'SchellenbergPlatform', SchellenbergPlatform, true);
};

