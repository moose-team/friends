module.exports = Messages

var h = require('virtual-dom/h')

function Messages (app) {
  this.app = app
  this.className = 'messages'
}

Messages.prototype.render = function (messages) {
  messages = messages.map(function (msg) {
    return h('.message.clearfix', [
      h('img.avatar', { src: msg.avatar }),
      h('.username', msg.username),
      h('.timestamp', msg.timestamp),
      h('.text', msg.text)
    ])
  })
  return h('div', this, messages)
}
