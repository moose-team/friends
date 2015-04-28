module.exports = Composer

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Composer (target) {
  BaseElement.call(this, target)
}
inherits(Composer, BaseElement)

Composer.prototype.render = function () {
  var self = this

  var input = h('input', {
    placeholder: 'Send a message...',
    autofocus: true
  })

  return h('form.composer', {
    onsubmit: function (e) {
      e.preventDefault()
      var input = this.querySelector('input')
      self.send('sendMessage', input.value)
      input.value = ''
    }
  }, input)
}
