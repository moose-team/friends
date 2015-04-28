module.exports = Messages

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var EE = require('events').EventEmitter
var TopBar = require('./top-bar')

function Messages () {
  EE.call(this)
  var self = this

  // Whether we should auto scroll
  self.shouldAutoScroll = true
  self.on('scroll', function (node) {
    if (node.scrollHeight <= node.clientHeight + node.scrollTop) self.shouldAutoScroll = true
    else self.shouldAutoScroll = false
  })

  this.topBar = new TopBar({
    className: 'top-bar'
  })

  // On window resize, adjust the height for viewList calculations
  window.addEventListener('resize', function (e) {
    var messages = document.querySelector('.messages')
    self.viewList.height = messages.offsetHeight
  }, false)
}
inherits(Messages, EE)

Messages.prototype.render = function (channel) {
  var childViews

  if (channel && !channel.messages.length) {
    var starterMessage = 'This is new channel. Send a message to start things off!'
    childViews = h('.messages.starterMessage', starterMessage)
  } else {
    var messages = (channel ? channel.messages : []).map(function (msg) {
      var verified = !/Anonymous/i.test(msg.username) && msg.valid
      return h('li.message.clearfix', [
        h('img.avatar', { src: msg.avatar }),
        h('.username', msg.username),
        verified ? h('.verified') : null,
        h('.timestamp', msg.timeago),
        h('.text', msg.text)
      ])
    })
    childViews = h('.messages', messages)
  }

  return h('.messages-container', [
    this.topBar.render(channel),
    childViews
  ])
}

Messages.prototype.scrollToBottom = function () {
  if (!this.shouldAutoScroll) return
  setTimeout(function () {
    var messagesDiv = document.querySelector('.messages')
    if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
  }, 100)
}
