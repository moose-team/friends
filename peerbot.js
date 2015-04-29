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

  console.log('joining #friends')
  swarm.addChannel('friends')

  chans.forEach(function (chan) {
    console.log('joining #' + chan)
    swarm.addChannel(chan)
  })

  var counts = {
    connects: 0,
    disconnects: 0,
    pushed: 0,
    pulled: 0,
    active: 0,
    maxPeers: 0
  }
  
  swarm.on('push', function () {
    counts.pushed++
  })
  
  swarm.on('pull', function () {
    counts.pulled++
  })

  swarm.on('peer', function (p) {
    counts.active++
    counts.connects++
    if (counts.active > counts.maxPeers) counts.maxPeers = counts.active
    log(JSON.stringify(counts))
    eos(p, function () {
      counts.active--
      counts.disconnects++
      log(JSON.stringify(counts))
    })
  })
}