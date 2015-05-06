module.exports = Users

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Users (target) {
  BaseElement.call(this, target)
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
        onclick: function (e) {
          e.preventDefault()
          self.send('toggleBlockUser', username)
        }
      }, [
        h('img.avatar', { src: user.avatar }),
        username
      ])
    ])
  }

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
