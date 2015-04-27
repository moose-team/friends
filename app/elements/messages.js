module.exports = Messages

var h = require('virtual-dom/h')
var ViewList = require('view-list')

function Messages (app) {
  var self = this
  this.app = app

  this.viewList = new ViewList({
    className: 'messages',
    // TODO: Calculate this rowHeight automatically as well
    rowHeight: 35,
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

  // On window resize, adjust the height for viewList calculations
  window.addEventListener('resize', function (e) {
    var messages = document.querySelector('.messages')
    self.viewList.height = messages.offsetHeight
  }, false)
}

Messages.prototype.render = function (messages) {
  var childViews

  if (messages.length === 0) {
    var starterMessage = 'This is new channel. Send a message to start things off!'
    childViews = h('.messages.starterMessage', this, starterMessage)
  } else {
    childViews = this.viewList.render(messages)
  }

  return h('.messages-container', childViews)
}

Messages.prototype.scrollToBottom = function () {
  setTimeout(function () {
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
  }, 100)
}
