var fs = require('fs')
var ghsign = require('ghsign')
var request = require('request')
var verifiers = {}

module.exports.signer = signer
module.exports.verify = verify

ghsign = ghsign(function (username, cb) {
  fs.readFile('./public-keys/' + username + '.keys', 'utf-8', function (_, keys) {
    if (keys) return cb(null, keys)
    request('https://github.com/' + username + '.keys', function (_, response) {
      var keys = response.statusCode === 200 && response.body
      if (!keys) return cb(new Error('Could not find public keys for ' + username))
      fs.mkdir('./public-keys', function () {
        fs.writeFile('./public-keys/' + username + '.keys', keys, function () {
          cb(null, keys)
        })
      })
    })
  })
})

function signer (username) {
  return ghsign.signer(username)
}

function verify (username, message, signature, cb) {
  var vfy = verifiers[username]
  if (!verifiers[username]) verifiers[username] = vfy = ghsign.verifier(username)
  if (!vfy || !username || !signature) return cb(null, false)

  vfy(message, signature, cb)
}
