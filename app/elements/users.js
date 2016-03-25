module.exports = Users

var inherits = require('util').inherits
var BaseElement = require('./base-element')
var ModalElement = require('modal-element')
var yo = require('yo-yo')

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

    function oncontextmenu (e) {
      e.preventDefault()
      self.showUserMenuFor = username
      self.lastClickPosition = [e.clientX, e.clientY]
      self.send('render')
    }

    return yo`
      <li class="${className}">
        <button oncontextmenu=${oncontextmenu}>
          <img class="avatar" src="${user.avatar}" />
          ${username}
        </button>
      </li>
    `
  }

  // Build user menu
  this.userMenu.shown = !!this.showUserMenuFor
  var ignoreLabel = 'mute'
  if (users[this.showUserMenuFor] && users[this.showUserMenuFor].blocked) ignoreLabel = 'unmute'

  function onclick (e) {
    e.preventDefault()
    self.send('toggleBlockUser', self.showUserMenuFor)
  }

  this.userMenu.render(
    yo`
      <ul>
        <li>
          <a href="https://github.com/${this.showUserMenuFor}" target="_blank">
            open github.com/${this.showUserMenuFor}
          </a>
        </li>
        <li>
          <button onclick=${onclick}>
            ${ignoreLabel} ${this.showUserMenuFor}
          </button>
        </li>
      </ul>
    `
  )

  return yo`
    <div class="users-container">
      <div class="heading">Active Users (${activeUsers.length})</div>
      <ul class="users">${activeUsers}</ul>
      <div class="heading">Idle Users (${idleUsers.length})</div>
      <ul class="users">${idleUsers}</ul>
    </div>
  `
}
