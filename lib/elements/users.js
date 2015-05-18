module.exports = Users

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')
var ModalElement = require('modal-element')

function Users (target) {
  BaseElement.call(this, target)
  var self = this
  this.showUserMenuFor = false
  this.lastClickPosition = [0, 0]
  this.userMenu = new ModalElement(document.body)
  this.userMenu.centerOnLoad = false
  this.userMenu.on('load', function (node) {
    node.childNodes[0].style.top = self.lastClickPosition[1] + 'px'
    node.childNodes[0].style.left = self.lastClickPosition[0] + 'px'
  })
}
inherits(Users, BaseElement)

Users.prototype.render = function (users) {
  var self = this
  var now = new Date().getTime()

  var activeUsers = []
  var idleUsers = []
  var sortedUsers = Object.keys(users).sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  idleUsers = sortedUsers.filter(function (username) {
    var user = users[username]
    // User is "active" if they sent a message in the last 60 mins (3600000ms)
    if (now - user.lastActive < 3600000) {
      activeUsers.push(username)
      return false
    }
    return true
  })

  idleUsers = idleUsers.map(enrichUsers)
  activeUsers = activeUsers.map(enrichUsers)

  function enrichUsers (username) {
    var user = users[username]
    var className = user.blocked ? 'blocked' : ''
    return h('li', { className: className }, [
      h('button', {
        oncontextmenu: function (e) {
          e.preventDefault()
          self.showUserMenuFor = username
          self.lastClickPosition = [e.clientX, e.clientY]
          self.send('render')
        }
      }, [
        h('img.avatar', { src: user.avatar }),
        username
      ])
    ])
  }

  // Build user menu
  this.userMenu.shown = !!this.showUserMenuFor
  var ignoreLabel = 'mute user'
  if (users[this.showUserMenuFor] && users[this.showUserMenuFor].blocked) ignoreLabel = 'unmute user'
  this.userMenu.render(
    h('ul', [
      h('li', h('a', {
        href: 'https://github.com/' + this.showUserMenuFor,
        target: '_blank'
      }, 'github.com/' + this.showUserMenuFor)),
      h('li', h('button', {
        onclick: function (e) {
          e.preventDefault()
          self.send('toggleBlockUser', self.showUserMenuFor)
        }
      }, ignoreLabel))
    ])
  )

  return [
    h('.heading', 'Active Users (' + activeUsers.length + ')'),
    h('ul.users', [
      activeUsers
    ]),
    h('.heading', 'Idle Users (' + idleUsers.length + ')'),
    h('ul.users', [
      idleUsers
    ])
  ]
}
