/* global Notification */

module.exports = window.App = App

var fs = require('fs')
var EventEmitter = require('events').EventEmitter

var shell = require('shell')
var remote = require('remote')
var app = remote.require('app')

var catNames = require('cat-names')
var createElement = require('virtual-dom/create-element')
var delegate = require('delegate-dom')
var diff = require('virtual-dom/diff')
var eos = require('end-of-stream')
var h = require('virtual-dom/h')
var inherits = require('inherits')
var patch = require('virtual-dom/patch')
var raf = require('raf')
var user = require('github-current-user')
var ghsign = require('ghsign')
var request = require('request')

var richMessage = require('./lib/rich-message.js')
var Swarm = require('./lib/swarm.js')
var util = require('./lib/util.js')

var Channels = require('./lib/elements/channels.js')
var Composer = require('./lib/elements/composer.js')
var Messages = require('./lib/elements/messages.js')
var Status = require('./lib/elements/status.js')
var Users = require('./lib/elements/users.js')
var Peers = require('./lib/elements/peers.js')

var currentWindow = remote.getCurrentWindow()

ghsign = ghsign(function (username, cb) {
  fs.readFile('./public-keys/' + username + '.keys', 'utf-8', function (err, keys) {
    if (err) return cb(err)
    if (keys) return cb(null, keys)
    request('https://github.com/' + username + '.keys', function (err, response) {
      if (err) return cb(err)
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

delegate.on(document.body, 'a', 'click', function (e) {
  var href = e.target.getAttribute('href')
  if (/^https?:/.test(href)) {
    e.preventDefault()
    shell.openExternal(href)
  }
})

inherits(App, EventEmitter)

function App (el) {
  var self = this
  if (!(self instanceof App)) return new App(el)

  // The mock data model
  self.data = {
    peers: 0,
    username: 'Anonymous (' + catNames.random() + ')',
    channels: [],
    messages: [],
    users: []
  }

  var swarm = window.swarm = Swarm()
  user.verify(function (err, verified, username) {
    if (err) return console.error(err.message || err)
    if (verified) {
      self.data.username = username
      swarm.username = username
      ghsign.verifier(username)
    } else {
      self.data.username = 'Anonymous (' + catNames.random() + ')'
    }
  })

  var channelsFound = {}
  var usersFound = {}
  var verifiers = {}

  swarm.process(function (entry, cb) {
    var basicMessage = JSON.parse(entry.value)
    var userVerify = verifiers[basicMessage.username]

    var onverify = function () {
      var message = richMessage(basicMessage)
      var channelName = message.channel || 'friends'
      var channel = channelsFound[channelName]

      if (!channel) {
        channel = channelsFound[channelName] = {
          id: self.data.channels.length,
          name: channelName,
          active: false,
          messages: []
        }
        self.data.channels.push(channel)
      }

      var anon = /Anonymous/i.test(message.username)

      message.avatar = anon
        ? 'static/Icon.png'
        : 'https://github.com/' + message.username + '.png'
      message.timeago = util.timeago(message.timestamp)

      if (self.data.username && !currentWindow.isFocused()) {
        console.log(message.rawText)
        if (message.rawText.indexOf(self.data.username) > -1) {
          new Notification('Mentioned in #' + channel.name, { // eslint-disable-line
            body: message.username + ': ' + message.rawText.slice(0, 20)
          })

          self.setBadge()
        }
      }

      channel.messages.push(message)

      if (!message.anon && message.valid && !usersFound[message.username]) {
        usersFound[message.username] = true
        self.data.users.push({
          name: message.username,
          avatar: message.avatar
        })
      }
      if (!message.anon && !message.valid) {
        message.username = 'Allegedly ' + message.username
      }

      self.views.messages.scrollToBottom()
      cb()
    }

    if (!userVerify && basicMessage.sig) userVerify = verifiers[basicMessage.username] = ghsign.verifier(basicMessage.username)
    if (userVerify && basicMessage.sig) {
      var msg = Buffer.concat([
        new Buffer(basicMessage.username),
        new Buffer(basicMessage.channel ? basicMessage.channel : ''),
        new Buffer(basicMessage.text),
        new Buffer(basicMessage.timestamp.toString())
      ])
      userVerify(msg, new Buffer(basicMessage.sig, 'base64'), function (err, valid) {
        if (err) basicMessage.valid = false
        basicMessage.valid = valid
        onverify()
      })
      return
    }

    onverify()
  })

  swarm.on('peer', function (p) {
    self.data.peers++
    eos(p, function () {
      self.data.peers--
    })
  })

  channelsFound.friends = {
    id: 0,
    name: 'friends',
    active: true,
    messages: []
  }

  self.data.channels.push(channelsFound.friends)
  self.data.messages = channelsFound.friends.messages

  // View instances used in our App
  self.views = {
    channels: new Channels(self),
    composer: new Composer(self),
    messages: new Messages(self),
    users: new Users(self),
    peers: new Peers(self),
    status: new Status(self)
  }

  // Initial DOM tree render
  var tree = self.render()
  var rootNode = createElement(tree)
  el.appendChild(rootNode)

  // Main render loop
  raf(function tick () {
    var newTree = self.render()
    var patches = diff(tree, newTree)
    rootNode = patch(rootNode, patches)
    tree = newTree
    raf(tick)
  })

  self.on('selectChannel', function (selectedChannel) {
    self.data.channels.forEach(function (channel) {
      channel.active = (selectedChannel === channel)
      if (channel.active) self.data.messages = channel.messages
    })
    self.views.messages.scrollToBottom()
  })

  self.on('sendMessage', function (text) {
    text = text.trim()
    if (text.length === 0) return

    var activeChannel = self.data.channels.reduce(function (a, b) {
      return a && a.active ? a : b
    }, null)

    swarm.send({
      username: self.data.username,
      channel: activeChannel && activeChannel.name,
      text: text,
      timestamp: Date.now()
    })
  })

  self.on('addChannel', function (channelName) {
    if (channelName[0] === '#') channelName = channelName.substring(1)
    if (!channelsFound[channelName]) {
      var channel = channelsFound[channelName] = {
        name: channelName,
        id: self.data.channels.length,
        active: false,
        messages: []
      }
      self.data.channels.push(channel)
      swarm.addChannel(channelName)
    }
  })

  // Update friendly "timeago" time string (once per minute)
  setInterval(function () {
    self.data.messages.forEach(function (message) {
      message.timeago = util.timeago(message.timestamp)
    })
  }, 60 * 1000)
}

App.prototype.render = function () {
  var self = this
  var views = self.views
  var data = self.data

  return h('div.layout', [
    h('.sidebar', [
      h('.sidebar-scroll', [
        views.channels.render(data.channels),
        views.users.render(data.users),
        views.peers.render(data)
      ]),
      views.status.render(data)
    ]),
    h('.content', [
      views.messages.render(data.messages),
      views.composer.render()
    ])
  ])
}

App.prototype.setBadge = function (num) {
  if (typeof this._notifications === 'undefined' || this._notifications === null) {
    this._notifications = 0
  }
  if (num === false) {
    return app.dock.setBadge('')
  } else if (typeof num === 'undefined' || num === null) {
    this._notifications++
  } else {
    this._notifications = num
  }
  app.dock.setBadge(this._notifications.toString())
}
