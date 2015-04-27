module.exports = Composer

var h = require('virtual-dom/h')

function Composer (app) {
  this.app = app
}

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
      self.app.emit('sendMessage', input.value)
      input.value = ''
    }
  }, input)
}
