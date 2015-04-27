module.exports = Messages

var h = require('virtual-dom/h')
var moment = require('moment')
var ViewList = require('view-list')

function Messages (app) {
  this.app = app

  // Create an onlooad hook that starts the list at the bottom
  var Onload = function () {}
  Onload.prototype.hook = function (node, propertyName, previousValue) {
    setTimeout(function () {
      node.scrollTop = node.scrollHeight
    }, 0)
  }

  this.viewList = new ViewList({
    className: 'messages',
    onload: new Onload(),
    eachrow: function(msg) {
      return h('li.message.clearfix', [
        h('img.avatar', { src: msg.avatar }),
        h('.username', msg.username),
        h('.timestamp', moment(msg.timestamp).fromNow()),
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
