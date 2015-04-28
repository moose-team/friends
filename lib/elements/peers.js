module.exports = Peers

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Peers (target) {
  BaseElement.call(this, target)
}
inherits(Peers, BaseElement)

Peers.prototype.render = function (data) {
  return h('.peers', 'Connected to ' + data.peers + ' peer' + (data.peers === 1 ? '' : 's'))
}
