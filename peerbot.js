var levelup = require('levelup')
var leveldown = require('leveldown')
var subleveldown = require('subleveldown')
var log = require('single-line-log').stdout
var eos = require('end-of-stream')
var minimist = require('minimist')
var Swarm = require('./lib/swarm.js')

module.exports = function (args) {
  var db = levelup('./friendsdb', {db: leveldown})
  db.channels = subleveldown(db, 'channels', {valueEncoding: 'json'})
  var swarm = Swarm(subleveldown(db, 'swarm'))

  var args = minimist(args)

  var chans = args.channel || []
  if (typeof chans === 'string') chans = [chans]

  chans.forEach(function (chan) {
    console.error('joining channel', chan)
    swarm.addChannel(chan)
  })

  var peers = 0

  swarm.on('peer', function (p) {
    peers++
    log('connected peers: ' + peers)
    eos(p, function () {
      peers--
      log('connected peers: ' + peers)
    })
  })
}