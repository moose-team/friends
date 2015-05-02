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
      'https://signalhub.publicbit.org',
      'https://signalhub.mafintosh.com',
      'http://dev.mathiasbuus.eu:8080' // deprecated
    ])
    var sw = swarm(hub, defaultOpts)

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

    var addMessage = function (m, sig) {
      var ch = message.channel || 'friends'
      emitter.addChannel(ch)
      var log = logs[ch]
      log.heads(function (err, heads) {
        if (err) return cb(err)
        log.add(heads, messages.SignedMessage.encode({signature: sig, message: m}), cb)
      })
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

      rs.pipe(through.obj(function (data, enc, cb) {
        if (data.value.toString()[0] === '{') return cb() // old stuff

        var val = messages.SignedMessage.decode(data.value)
        var m = messages.Message.decode(val.message)
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
        processor(m, cb)
      }))
    })
  }

  return emitter
}
