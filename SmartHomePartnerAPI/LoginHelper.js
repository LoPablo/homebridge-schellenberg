const crypto = require('crypto');
const base64 = require('base-64');

class LoginHelper {
    static calculateDigest(password, salt, sessionSalt) {
        var hashedPassword = this.getPasswordHash(password, salt);
        var finishedDigest = this.getDigest(hashedPassword, sessionSalt);
        return finishedDigest;

    }

    // https://stackoverflow.com/questions/3195865      modified
    static string2Bin(str) {
        let result = [];
        for (let i = 0; i < str.length; i++) {
            let p = str.charCodeAt(i);
            if (p > 128) {
                result.push(p - 256);
            } else {
                result.push(p);
            }
        }
        return result;
    }

    // https://stackoverflow.com/questions/3195865     turned around
    static bin2String(array) {
        let result = '';
        for (let i = 0; i < array.length; i++) {
            let p = String.fromCharCode(array[i]);
            result += p;
            //if (p>128){
            //   result.push(p-256);
            //}else {
            //    result.push(p);
            //}
        }
        return result;

        return String.fromCharCode.apply(String, array);
    }

    static getDigest(password, sessionSalt) {
        let digest = this.getHashSHA1(password, sessionSalt);
        return digest;
    }

    static getPasswordHash(password, salt) {
        let digest = this.getHashSHA256(password, salt);
        console.log('getPasswordHash: ' + digest);
        return digest;
    }

    static getHashSHA1(password, salt) {
        let decode = base64.decode(salt);
        let saltArray = this.string2Bin(decode);
        let passwordArray = this.string2Bin(password);
        let pasConSalt = passwordArray.concat(saltArray);
        let shacrypt = crypto.createHash('sha1').update(new Uint8Array(pasConSalt));
        let fin = shacrypt.digest('base64');

        console.log('getHashSHA1:' + fin);
        return fin;
    }

    static getHashSHA256(password, salt) {
        let decode = base64.decode(salt);
        let saltArray = this.string2Bin(decode);
        let passwordArray = this.string2Bin(password);
        let pasConSalt = passwordArray.concat(saltArray);
        let shacrypt = crypto.createHash('sha256').update(new Uint8Array(pasConSalt));
        let fin = shacrypt.digest('base64');

        console.log('getHashSHA256:' + fin);
        return fin;
    }
}

module.exports = LoginHelper;

