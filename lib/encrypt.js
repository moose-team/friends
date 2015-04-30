'use strict';
var crypto = require('crypto');

exports.getIV = getIV;
exports.encryptMessage = (
  typeof process.hrtime === 'function' ?
    encryptMessage :
    function () {
      throw new Error('need process.hrtime for this to work');
    }
);
exports.decryptMessage = decryptMessage;
function getIV(key, msg, aad) {
  aad = aad || new Buffer('')
  var inner = crypto.createHmac('sha512', key).update(msg).digest()
  return crypto.createHmac('sha224', inner)
    .update(process.hrtime().join())
    .update(aad)
    .digest().slice(0, 16);
}

function encryptMessage(key, message, username) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('invalid key');
  }
  var iv = getIV(key, message, username);
  var cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  var out = cipher.update(message);
  cipher.final();
  return {
    nonce: iv,
    message: out,
    username: username
  };
}

function decryptMessage(key, obj) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error('invalid key');
  }
  var cipher = crypto.createCipheriv('aes-256-ctr', key, obj.nonce);
  var out = cipher.update(obj.message);
  cipher.final();
  return out;
}
