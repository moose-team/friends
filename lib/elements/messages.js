module.exports = Messages

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Messages (target) {
  BaseElement.call(this, target)
  this.shouldAutoScroll = true
}
inherits(Messages, BaseElement)

Messages.prototype.render = function (channel, username) {
  var self = this
  var childViews

  if (channel && channel.messages.length === 0) {
    var starterMessage = 'This is new channel. Send a message to start things off!'
    childViews = h('.messages.starterMessage', starterMessage)
  } else {
    var messages = (channel ? channel.messages : []).map(function (msg) {
      var verified = !/Anonymous/i.test(msg.username) && msg.valid
      var fromMe = (msg.username === username)

      return h('li.message.clearfix', [
        h('img.avatar', { src: msg.avatar }),
        h('div', { className: (fromMe ? 'me ' : '') + 'username' }, msg.username),
        verified ? h('.verified') : null,
        h('.timestamp', msg.timeago),
        h('.text', msg.vdom || msg.text)
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
    if (!channel || channel.name === 'friends') return
    self.send('leaveChannel', channel.name)
  }

  var leavableChannel = channel.name !== 'friends'

  return h('.messages-container', [
    h('div', { className: 'top-bar' }, [
      h('.channelName', '#' + (channel ? channel.name : 'friends') + ' (' + channel.peers + ' peer' + (channel.peers === 1 ? '' : 's') + ')'),
      leavableChannel ? h('a.button.leaveButton', {onclick: onleave}, 'Leave') : null
    ]),
    childViews
  ])
}

Messages.prototype.scrollToBottom = function () {
  if (!this.shouldAutoScroll) return
  var messagesDiv = document.querySelector('.messages')
  if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
}
