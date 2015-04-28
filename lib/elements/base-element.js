module.exports = BaseElement

var inherits = require('util').inherits
var EE = require('events').EventEmitter

function BaseElement (target) {
  EE.call(this)
  this.target = target || null
}
inherits(BaseElement, EE)

BaseElement.prototype.send = function () {
  if (this.target && typeof this.target.emit === 'function') {
    this.target.emit.apply(this.target, arguments)
  }
}
