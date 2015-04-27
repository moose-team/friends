module.exports = window.App = App

var createElement = require('virtual-dom/create-element')
var diff = require('virtual-dom/diff')
var EventEmitter = require('events').EventEmitter
var h = require('virtual-dom/h')
var h = require('virtual-dom/h')
var inherits = require('inherits')
var patch = require('virtual-dom/patch')
var raf = require('raf')
var user = require('github-current-user')
var catNames = require('cat-names')

var Swarm = require('./swarm.js')

var Channels = require('./elements/channels')
var Composer = require('./elements/composer')
var Messages = require('./elements/messages')
var Users = require('./elements/users')

inherits(App, EventEmitter)

function App (el) {
  var self = this
  if (!(self instanceof App)) return new App(el)

  user.verify(function (err, verified, username) {
    if (err) return alert(err.message || err)
    if (verified) {
      self.data.username = username
    } else {
      self.data.username = 'Anonymous (' + catNames.random() + ')'
    }
  })

  var swarm = window.swarm = Swarm()
  var logStream = swarm.log.createReadStream({live: true})
  logStream.on('data', function (entry) {
    var val = JSON.parse(entry.value)
    self.data.messages.push(val)
  })

  // The mock data model
  self.data = {
    username: 'Anonymous (' + catNames.random() + ')',
    channels: [
      { id: 0, name: 'stackvm', active: true },
      { id: 1, name: 'nerdtracker' },
      { id: 2, name: 'dat' },
      { id: 3, name: 'webtorrent' }
    ],
    messages: [
      {
        username: 'maxogden',
        text: 'I\'m a cat!',
        timestamp: '1:30 AM',
        avatar: 'static/Icon.png'
      },
      {
        username: 'feross',
        text: 'I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat! I\'m a cat!',
        timestamp: '1:30 AM',
        avatar: 'static/Icon.png'
      }
    ],
    users: [
      { name: 'feross', avatar: 'static/Icon.png' },
      { name: 'maxogden', avatar: 'static/Icon.png' },
      { name: 'mafintosh', avatar: 'static/Icon.png' },
      { name: 'ngoldman', avatar: 'static/Icon.png' },
      { name: 'shama', avatar: 'static/Icon.png' },
      { name: 'jlord', avatar: 'static/Icon.png' },
      { name: 'chrisdickinson', avatar: 'static/Icon.png' }
    ]
  }

  // View instances used in our App
  self.views = {
    channels: new Channels(self),
    composer: new Composer(self),
    messages: new Messages(self),
    users: new Users(self)
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
    })
  })

  self.on('sendMessage', function (message) {
    swarm.send({
      username: self.data.username,
      text: message,
      timestamp: Date.now(),
      avatar: 'static/Icon.png'
    })
  })
}

App.prototype.render = function () {
  var self = this
  var views = self.views
  var data = self.data

  return h('div.layout', [
    h('.sidebar', [
      views.channels.render(data.channels),
      views.users.render(data.users),
      h('.heading', 'Your username'),
      data.username
    ]),
    h('.content', [
      views.messages.render(data.messages),
      views.composer.render()
    ])
  ])
}
