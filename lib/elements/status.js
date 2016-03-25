module.exports = Status

var inherits = require('util').inherits
var BaseElement = require('./base-element')
var yo = require('yo-yo')

function Status (target) {
  BaseElement.call(this, target)
}
inherits(Status, BaseElement)

Status.prototype.render = function (username, peers) {
  return yo`
    <div class="status">
      <div class="username">${username}</div>
      <div class="peers">Connected to ${peers} peer${peers === 1 ? '' : 's'}</div>
    </div>
  `
}
