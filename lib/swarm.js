var events = require('events')
var subleveldown = require('subleveldown')
var swarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var hyperlog = require('hyperlog')
var ghsign = require('ghsign')
var through = require('through2')
var protobuf = require('protocol-buffers')
var fs = require('fs')
var request = require('request')
var encrypt = require('./encrypt')
var Github = require('github')
var crypto = require('crypto')
var path = require('path')
var github = new Github({version: '3.0.0'})
try {
  github.authenticate(require('../apikey.json'))
} catch(_) {
  console.log('no private chat for you')
}
var readSync = function(file) {
  try {
    return fs.readFileSync(file)
  } catch (err) {
    return null
  }
}
var HOME = process.env.HOME || process.env.USERPROFILE
var DEFAULT_SSH_KEY = readSync(path.join(HOME, '.ssh/id_rsa'))
var messages = protobuf(fs.readFileSync(__dirname + '/../schema.proto'))

module.exports = createSwarm

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

var verifiers = {}

function createSwarm (db, defaultOpts) {
  var emitter = new events.EventEmitter()
  var logs = {}

  emitter.logs = logs

  var sign
  var processor

  emitter.changes = function (name) {
    return logs[name] ? logs[name].changes : 0
  }

  emitter.process = function (fn) {
    processor = fn
    Object.keys(logs).forEach(function (name) {
      startProcessor(logs[name])
    })
  }

  emitter.removeChannel = function (name) {
    var log = logs[name]
    if (!log) return
    delete logs[name]

    if (log.processing) log.processing.destroy()
    log.peers.forEach(function (p) {
      p.destroy()
    })
  }

  emitter.addChannel = function (name) {
    if (logs[name]) return

    var log = logs[name] = hyperlog(subleveldown(db, name))
    var id = 'friends-' + name
    var hub = signalhub(id, [
      'https://signalhub.publicbits.org',
      'https://signalhub.mafintosh.com',
      'https://beaugunderson.com/signalhub',
      'http://dev.mathiasbuus.eu:8080' // deprecated
    ])
    var sw = swarm(hub, defaultOpts)

    if (name.indexOf('/') > -1) {
      log.private = true
      log.keys = {}
      setupEncryption(log, name)
    } else {
      log.private = false
    }
    log.peers = []

    sw.on('peer', function (p, id) {
      var stream = log.replicate({live: true})

      log.peers.push(p)
      p.on('close', function () {
        var i = log.peers.indexOf(p)
        if (i > -1) log.peers.splice(i, 1)
      })

      emitter.emit('peer', p, name, id, stream)

      stream.on('push', function () {
        emitter.emit('push', name)
      })

      stream.on('pull', function () {
        emitter.emit('pull', name)
      })

      p.pipe(stream).pipe(p)
    })

    if (processor) startProcessor(log)
  }

  emitter.send = function (message, cb) {
    if (!sign && emitter.username) {
      sign = ghsign.signer(emitter.username)
    }
    var ch = message.channel || 'friends'
    emitter.addChannel(ch)
    var log = logs[ch]
    var addMessage = function (m, sig) {
      log.heads(function (err, heads) {
        if (err) return cb(err)
        log.add(heads, messages.SignedMessage.encode({signature: sig, message: m}), cb)
      })
    }

    if (log.private) {
      if (!log.credentials) {
        log.once('credentials', function () {
          sendEncrypted(message, log, sign, cb)
        })
        return
      }
      sendEncrypted(message, log, sign, cb)
      return
    }

    var m = messages.Message.encode(message)

    if (sign) {
      sign(m, function (err, sig) {
        if (err) return cb(err)
        addMessage(m, sig)
      })
      return
    }

    addMessage(m, null)
  }

  function startProcessor (log) {
    log.ready(function () {
      if (log.processing) return

      var rs = log.processing = log.createReadStream({
        live: true,
        since: Math.max(log.changes - 500, 0)
      })
      function getKey (data, verify, cb) {
        var id = data.links[1]
        if (log.keys[id]) {
          cb(null, log.keys[id])
          return
        }
        log.get(id, function (err, node) {
          if (err) {
            cb(err)
            return
          }
          var val = messages.SignedMessage.decode(data.value)
          verify(val.message, val.signature, function (_, valid) {
            if (!valid) {
              cb()
              return
            }
            var m = messages.Message.decode(val.message)
            if (m.users && m.users[emitter.username]) {
              var encryptedKey = m.users[emitter.username]
              if (!DEFAULT_SSH_KEY) {
                cb()
                return
              }
              var key = log.keys[id] = crypto.privateDecrypt(DEFAULT_SSH_KEY, encryptedKey)
              cb(null, key)
            }
          })
        })
      }
      function decryptMessage (data, val, cb) {
        var u = val.username
        var verify = verifiers[u]

        if (u && !verifiers[u]) verifiers[u] = verify = ghsign.verifier(u)

        if (!verify || !val.signature) {
          cb()
          return
        }
        verify(val.message, val.signature, function (_, valid) {
          if (!valid) {
            cb()
            return
          }
          getKey(data, verify, function (err, key) {
            if (err) {
              cb()
              return
            }
            var decrypted = encrypt.decryptMessage(key, val)
            var m = messages.Message.decode(decrypted)
            m.change = data.change
            m.valid = true
            processor(m, cb)
          })
        })
      }

      rs.pipe(through.obj(function (data, enc, cb) {
        if (data.value.toString()[0] === '{') return cb() // old stuff

        var val = messages.SignedMessage.decode(data.value)

        if (val.nonce) {
          decryptMessage(data, val, cb)
          return
        }

        var m = messages.Message.decode(val.message)

        if (m.users) return cb() // not for us
        var u = m.username
        var verify = verifiers[u]

        if (u && !verifiers[u]) verifiers[u] = verify = ghsign.verifier(u)

        m.change = data.change

        if (verify && val.signature) {
          verify(val.message, val.signature, function (_, valid) {
            m.valid = !!valid
            processor(m, cb)
          })
          return
        }

        m.valid = false

        if (!m.nonce) {
          processor(m, cb)
        } else {
          cb()
        }
      }))
    })
  }
  function encryptForAll (key, members, cb) {
    var credentials = {}
    var done = 0
    var total = members.length
    var error = false
    members.forEach(function (member) {
      ghsign.publicKeys(member, function (err, keys) {
        if (error) return
        if (err) {
          onerr(err)
          return
        }
        if (!Array.isArray(keys) || !keys.length) {
          onerr(new Error('no key found'))
          return
        }
        credentials[member] = crypto.publicEncrypt(keys[0], key)
        check()
      })
    })
    function onerr (err) {
      if (error) return
      error = true
      cb(err)
    }
    function check () {
      if (error) return
      done++
      if (done < total) {
        return
      }
      cb(null, credentials)
    }
  }
  function setupEncryption (log, name) {
    var org = name.split('/')[0]
    var team = name.split('/')[1]
    github.orgs.getTeams({org: org}, function (err, teams) {
      if (err) return log.emit('error', err)
      var teamData = teams.filter(function (teamObj) {
        return teamObj.name.toLowerCase() === team.toLowerCase()
      })[0]
      github.orgs.getTeamMembers({id: teamData.id}, function (err, memberInfo) {
        if (err) return log.emit('error', err)
        var members = memberInfo.map(function (member) {
          return member.login
        })
        var key = crypto.randomBytes(32)
        encryptForAll(key, members, function (err, credentials) {
          if (err) return log.emit('error', err)
          var msg = {
            username: emitter.username
          }
          var m = messages.Message.encode({
            users: credentials
          })
          msg.message = m
          sign(m, function (err, sig) {
            if (err) return log.emit('error', err)
            msg.signature = sig
            log.heads(function (err, heads) {
              if (err) return log.emit('error', err)
              log.add(heads, messages.SignedMessage.encode(msg), function (err, resp) {
                if (err) return log.emit('error', err)
                log.credentials = {
                  key: key,
                  head: resp.key
                }
                log.emit('credentials')
              })
            })
          })
        })
      })
    })
  }
  function sendEncrypted (message, log, sign, cb) {
    var key = log.credentials.key
    var head = log.credentials.head
    var username = emitter.username

    var encryptedMessage = encrypt.encryptMessage(key, message, username)
    sign(encryptedMessage.message, function (err, sig) {
      if (err) return cb(err)
      encryptedMessage.signature = sig
      log.heads(function (err, heads) {
        if (err) return cb(err)
        heads.push(head)
        log.add(heads, messages.SignedMessage.encode(encryptedMessage), cb)
      })
    })
  }
  return emitter
}
