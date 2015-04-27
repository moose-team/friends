module.exports = Users

var h = require('virtual-dom/h')

function Users (app) {
  this.app = app
}

Users.prototype.render = function (users) {
  users = users.map(function (user) {
    var className = user.active ? 'active' : ''
    return h('li', { className: className }, [
      h('a', {
        href: '#',
        onclick: function () {
          window.alert('selected user! ' + user.name) // eslint-disable-line
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
