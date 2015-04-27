module.exports = Composer

var h = require('virtual-dom/h')

function Composer (app) {
  this.app = app
}

Composer.prototype.render = function () {
  var self = this

  var input = h('input.text', {
    placeholder: 'Send a message...',
    autofocus: true
  })

  return h('form', {
    onsubmit: function (e) {
      e.preventDefault()
      var input = this.querySelector('input.text')
      self.app.emit('sendMessage', input.value)
      input.value = ''
    }
  }, input)
}
