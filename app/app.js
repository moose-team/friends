module.exports = window.App = App

var h = require('virtual-dom/h')
var diff = require('virtual-dom/diff')
var patch = require('virtual-dom/patch')
var createElement = require('virtual-dom/create-element')
var raf = require('raf')

var Channels = require('./elements/channels')
var Messages = require('./elements/messages')
var Users = require('./elements/users')

function App (el) {
  var self = this
  if (!(self instanceof App)) return new App(el)

  // The mock data model
  self.data = {
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
    channels: new Channels(),
    messages: new Messages(),
    users: new Users()
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
}

App.prototype.render = function () {
  var self = this
  var views = self.views
  var data = self.data
  return h('div.layout', [
    h('.sidebar', [
      views.channels.render(data.channels),
      views.users.render(data.users)
    ]),
    h('.content', [
      views.messages.render(data.messages),
      h('input.text')
    ])
  ])
}
