module.exports = Composer

var h = require('virtual-dom/h')

function Composer (app) {
  this.app = app
  this.className = 'Composer'
}

Composer.prototype.render = function () {
  var self = this

  var input = h('input.text', {
    placeholder: 'Send a message...',
    autofocus: true
  })
  return h('form', {
    onsubmit: function () {
      self.app.emit('sendMessage', input.value)
    }
  }, input)
}
