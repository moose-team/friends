var events = require('events')
var subleveldown = require('subleveldown')
var swarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var hyperlog = require('hyperlog')
var ghsign = require('ghsign')
var through = require('through2')

module.exports = createSwarm

function createSwarm (db) {
  var emitter = new events.EventEmitter()
  var logs = {}

  emitter.logs = logs

  var sign
  var processor

  var startProcessor = function (log) {
    if (log.processing) return
    log.processing = true
    log.ready(function () {
      var rs = log.createReadStream({
        live: true,
        since: Math.max(log.changes - 500, 0)
      })

      rs.pipe(through.obj(function (data, enc, cb) {
        processor(data, cb)
      }))
    })
  }

  emitter.process = function (fn) {
    processor = fn
  }

  emitter.addChannel = function (name) {
    if (logs[name]) return

    var log = logs[name] = hyperlog(subleveldown(db, name))
    var id = 'friends-' + name
    var hub = signalhub('http://dev.mathiasbuus.eu:8080', id)
    var sw = swarm(hub)

    sw.on('peer', function (p, id) {
      var stream = log.replicate({live: true})

      emitter.emit('peer', p, id, stream)

      stream.on('push', function () {
        emitter.emit('push')
        console.log('pushing node')
      })

      stream.on('pull', function () {
        emitter.emit('pull')
        console.log('pulling node')
      })

      p.pipe(stream).pipe(p)
    })

    startProcessor(log)
  }

  emitter.send = function (message, cb) {
    if (!sign && emitter.username) {
      sign = ghsign.signer(emitter.username)
    }

    var addMessage = function () {
      var ch = message.channel || 'friends'
      emitter.addChannel(ch)
      var log = logs[ch]
      log.heads(function (err, heads) {
        if (err) return cb(err)
        log.add(heads, JSON.stringify(message), cb)
      })
    }

    if (sign) {
      var msg = Buffer.concat([
        new Buffer(message.username),
        new Buffer(message.channel ? message.channel : ''),
        new Buffer(message.text),
        new Buffer(message.timestamp.toString())
      ])
      sign(msg, function (err, sig) {
        if (err) return cb(err)
        if (sig) {
          message.sig = sig.toString('base64')
        }
        addMessage()
      })
      return
    }

    addMessage()
  }

  emitter.addChannel('friends') // add default channel

  return emitter
}
