var inherits = require('inherits')
var xtend = require('xtend')
var h = require('virtual-dom/h')
var diff = require('virtual-dom/diff')
var patch = require('virtual-dom/patch')
var createElement = require('virtual-dom/create-element')
var raf = require('raf')

var Channels = require('./elements/channels')
var Messages = require('./elements/messages')

function App(el) {
  if (!(this instanceof App)) return new App(el)
  var self = this

  // The mock data model
  this.data = {
    channels: [
      { id: 0, name: 'max' },
      { id: 1, name: 'jessica' },
      { id: 2, name: 'mathias' },
      { id: 3, name: 'feross' },
      { id: 4, name: 'nate' },
      { id: 5, name: 'chris' },
      { id: 6, name: 'kyle' },
    ],
    messages: [
      { user_id: 0, message: 'this is a message' },
      { user_id: 0, message: 'this is another message' },
    ]
  }

  // View instances used in our App
  this.views = {
    channels: new Channels(),
    messages: new Messages(),
  }

  // Initial DOM tree render
  var tree = this.render()
  var rootNode = createElement(tree)
  el.appendChild(rootNode)

  // Main render loop
  raf(function tick() {
    var newTree = self.render()
    var patches = diff(tree, newTree)
    rootNode = patch(rootNode, patches)
    tree = newTree
    raf(tick)
  })
}
window.App = module.exports = App

App.prototype.render = function() {
  var views = this.views
  var data = this.data
  return h('div', {
    className: 'layout'
  }, [
    h('div', {
      className: 'sidebar'
    }, views.channels.render(data.channels)),
    h('div', {
      className: 'content'
    }, views.messages.render(data.messages)),
  ])
}
