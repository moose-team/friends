module.exports = window.App = App

var shell = require('shell')
var remote = require('remote')

var catNames = require('cat-names')
var createElement = require('virtual-dom/create-element')
var delegate = require('delegate-dom')
var diff = require('virtual-dom/diff')
var eos = require('end-of-stream')
var EventEmitter = require('events').EventEmitter
var h = require('virtual-dom/h')
var h = require('virtual-dom/h')
var inherits = require('inherits')
var moment = require('moment')
var patch = require('virtual-dom/patch')
var raf = require('raf')
var user = require('github-current-user')

var richMessage = require('./rich-message')
var Swarm = require('./swarm.js')

var Channels = require('./elements/channels')
var Composer = require('./elements/composer')
var Messages = require('./elements/messages')
var Status = require('./elements/status')
var Users = require('./elements/users')
var Peers = require('./elements/peers')

var currentWindow = remote.getCurrentWindow()

delegate.on(document.body, 'a', 'click', function (ev) {
  ev.preventDefault()
  var href = ev.target.getAttribute('href')
  shell.openExternal(href)
})

inherits(App, EventEmitter)

function App (el) {
  var self = this
  if (!(self instanceof App)) return new App(el)

  user.verify(function (err, verified, username) {
    if (err) return console.error(err.message || err)
    if (verified) {
      self.data.username = username
    } else {
      self.data.username = 'Anonymous (' + catNames.random() + ')'
    }
  })

  var swarm = window.swarm = Swarm()

  swarm.log.ready(function () {
    var usersFound = {}
    var channelsFound = {}

    channelsFound.friends = {
      id: 0,
      name: 'friends',
      active: true,
      messages: []
    }
    self.data.channels.push(channelsFound.friends)
    self.data.messages = channelsFound.friends.messages

    var logStream = swarm.log.createReadStream({
      live: true,
      since: Math.max(swarm.log.changes - 500, 0)
    })

    logStream.on('data', function (entry) {
      var message = richMessage(JSON.parse(entry.value))
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
      message.timeago = moment(message.timestamp).fromNow()

      if (self.data.username && !currentWindow.isFocused()) {
        console.log(message.rawText)
        if (message.rawText.indexOf(self.data.username) > -1) new Notification("Mention", {
          body: message.username + ': ' + message.rawText.slice(0, 10)
        })
      }
      
      channel.messages.push(message)

      if (!message.anon && !usersFound[message.username]) {
        usersFound[message.username] = true
        self.data.users.push({
          name: message.username,
          avatar: message.avatar
        })
      }

      self.views.messages.scrollToBottom()
    })
  })

  swarm.on('peer', function (p) {
    self.data.peers++
    eos(p, function () {
      self.data.peers--
    })
  })

  // The mock data model
  self.data = {
    peers: 0,
    username: 'Anonymous (' + catNames.random() + ')',
    channels: [],
    messages: [],
    users: []
  }

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

  // Update friendly "timeago" time string (once per minute)
  setInterval(function () {
    self.data.messages.forEach(function (message) {
      message.timeago = moment(message.timestamp).fromNow()
    })
  }, 60 * 1000)
}

App.prototype.render = function () {
  var self = this
  var views = self.views
  var data = self.data

  return h('div.layout', [
    h('.sidebar', [
      views.channels.render(data.channels),
      views.users.render(data.users),
      views.peers.render(data),
      views.status.render(data)
    ]),
    h('.content', [
      views.messages.render(data.messages),
      views.composer.render()
    ])
  ])
}
