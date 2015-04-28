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
  users = users.map(function (user) {
    var className = user.active ? 'active' : ''
    return h('li', { className: className }, [
      h('a', {
        href: '#',
        onclick: function () {
          self.send('selectUser', user)
        }
      }, [
        h('img.avatar', { src: user.avatar }),
        user.name
      ])
    ])
  })
  return [
    h('.heading', 'Users'),
    h('ul', [
      users
    ])
  ]
}
