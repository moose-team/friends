var events = require('events')
var subleveldown = require('subleveldown')
var swarm = require('webrtc-swarm')
var signalhub = require('signalhub')
var levelup = require('levelup')
var leveldown = require('leveldown')
var hyperlog = require('hyperlog')
var ghsign = require('ghsign')

module.exports = createSwarm

function createSwarm (app) {
  var emitter = new events.EventEmitter()
  var db = levelup('./friendsdb', {db: leveldown})
  var log = hyperlog(subleveldown(db, 'log'))

  var hub = signalhub('http://dev.mathiasbuus.eu:8080', 'friends')
  var sw = swarm(hub)

  emitter.db = db
  emitter.log = log
  emitter.hub = hub
  emitter.swarm = sw
  var sign;
  emitter.send = function (message, cb) {
    if (!sign && emitter.username) {
      sign = ghsign.signer(emitter.username)
    }

    if (sign) {
      var msg = Buffer.concat([
        new Buffer(message.username),
        new Buffer(message.channel ? message.channel: ''),
        new Buffer(message.text),
        new Buffer(message.timestamp.toString())
      ])
      return sign(msg, function (err, sig) {
        if (sig) {
          message.sig = sig.toString('base64')
        }
        log.heads(function (err, heads) {
          if (err) return cb(err)
          log.add(heads, JSON.stringify(message), cb)
        })
      });
    }

    log.heads(function (err, heads) {
      if (err) return cb(err)
      log.add(heads, JSON.stringify(message), cb)
    })
  }

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

  return emitter
}
