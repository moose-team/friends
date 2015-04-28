module.exports = Status

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Status (target) {
  BaseElement.call(this, target)
}
inherits(Status, BaseElement)

Status.prototype.render = function (username, peers) {
  return h('.status', [
    h('.username', username),
    h('.peers', 'Connected to ' + peers + ' peer' + (peers === 1 ? '' : 's'))
  ])
}
