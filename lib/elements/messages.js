module.exports = Messages

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var EE = require('events').EventEmitter

function Messages (app) {
  EE.call(this)
  this.app = app
  this.shouldAutoScroll = true
}
inherits(Messages, EE)

Messages.prototype.render = function (channel) {
  var self = this
  var childViews

  if (channel && channel.messages.length === 0) {
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
    childViews = h('.messages', {
      onscroll: function () {
        if (this.scrollHeight <= this.clientHeight + this.scrollTop) self.shouldAutoScroll = true
        else self.shouldAutoScroll = false
      }
    }, messages)
  }

  var onleave = function () {
    self.app.emit('leaveChannel', channel ? channel.name : 'friends')
  }

  return h('.messages-container', [
    h('div', { className: 'top-bar' }, [
      h('.channelName', '#' + (channel ? channel.name : 'friends') + ' (' + channel.peers + ' peer' + (channel.peers === 1 ? '' : 's') + ')'),
      h('a.button.leaveButton', {onclick: onleave}, 'Leave')
    ]),
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
