module.exports = Messages

var h = require('virtual-dom/h')
var ViewList = require('view-list')

function Messages (app) {
  this.app = app

  // Create an onlooad hook that starts the list at the bottom
  var Onload = function () {}
  Onload.prototype.hook = function (node, propertyName, previousValue) {
    // TODO: Still need a better way to call a hook after inserted into the DOM
    // TODO: See https://github.com/Matt-Esch/virtual-dom/issues/233
    setTimeout(function () {
      node.scrollTop = node.scrollHeight
    }, 0)
  }

  this.viewList = new ViewList({
    className: 'messages',
    onload: new Onload(),
    eachrow: function (msg) {
      // TODO: this is insecure. Need to only show this when public key is verified
      var verified = !/Anonymous/i.test(msg.username)

      return h('li.message.clearfix', [
        h('img.avatar', { src: msg.avatar }),
        h('.username', msg.username),
        verified ? h('.verified') : null,
        h('.timestamp', msg.timeago),
        h('.text', msg.text)
      ])
    }
  })
}

Messages.prototype.render = function (messages) {
  if (messages.length === 0) {
    var starterMessage = 'This is new channel. Send a message to start things off!'
    return h('.messages.starterMessage', this, starterMessage)
  }

  return this.viewList.render(messages)
}
