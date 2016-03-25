var fs = require('fs')
var ghsign = require('ghsign')
var get = require('simple-get')
var mkdirp = require('mkdirp')
var path = require('path')
var config = require('../config')
var verifiers = {}

module.exports.signer = signer
module.exports.verify = verify

if (!process.browser) {
  ghsign = ghsign(function (username, cb) {
    var userKeysPath = path.join(config.KEYS_PATH, username + '.keys')
    fs.readFile(userKeysPath, 'utf-8', function (_, keys) {
      if (keys) return cb(null, keys)
      get.concat('https://github.com/' + username + '.keys', function (_, res, body) {
        var keys = res.statusCode === 200 && body
        if (!keys) return cb(new Error('Could not find public keys for ' + username))
        mkdirp(config.KEYS_PATH, function () {
          fs.writeFile(userKeysPath, keys, function () {
            cb(null, keys.toString())
          })
        })
      })
    })
  })
}

function signer (username) {
  return ghsign.signer && ghsign.signer(username)
}

function verify (username, message, signature, cb) {
  var vfy = verifiers[username]
  if (!vfy && ghsign.verifier) verifiers[username] = vfy = ghsign.verifier(username)
  if (!vfy || !username || !signature) return cb(null, false)

  vfy(message, signature, cb)
}
