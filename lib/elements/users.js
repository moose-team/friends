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

  users = Object.keys(users).map(function (username) {
    var user = users[username]

    var className = user.active ? 'active' : ''
    return h('li', { className: className }, [
      h('a', {
        href: '#',
        onclick: function (e) {
          e.preventDefault()
          self.send('toggleBlockUser', username)
        },
        className: user.blocked ? 'blocked' : ''
      }, [
        h('img.avatar', { src: user.avatar }),
        username
      ])
    ])
  })
  return [
    h('.heading', 'Users'),
    h('ul.users', [
      users
    ])
  ]
}
