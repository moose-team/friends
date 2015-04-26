var inherits = require('inherits')
var h = require('virtual-dom/h')

function Messages(params) {
  if (!(this instanceof Messages)) return new Messages(params)
  this.className = 'messages'
}
module.exports = Messages

Messages.prototype.render = function(messages) {
  messages = messages.map(function(msg) {
    return h('li', [msg.user_id + ': ' + msg.message])
  })
  return h('ul', this, messages)
}
