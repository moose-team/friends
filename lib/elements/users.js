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

  users = Object.keys(users).sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  }).map(function (username) {
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
  })
  return [
    h('.heading', 'Users (' + users.length + ')'),
    h('ul.users', [
      users
    ])
  ]
}
