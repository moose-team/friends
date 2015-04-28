module.exports = Status

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Status (target) {
  BaseElement.call(this, target)
}
inherits(Status, BaseElement)

Status.prototype.render = function (data) {
  var self = this
  return h('.status', {
    onclick: function () {
      self.send('openStatus', data)
    }
  }, data.username)
}
