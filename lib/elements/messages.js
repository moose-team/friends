module.exports = Messages

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

var htmlToVDom = require('html-to-vdom')
var VNode = require('virtual-dom/vnode/vnode')
var VText = require('virtual-dom/vnode/vtext')

var convertHTML = htmlToVDom({
  VNode: VNode,
  VText: VText
})

function makeVDom (html) {
  return convertHTML('<div class="text">' + html + '</div>')
}

function Messages (target) {
  BaseElement.call(this, target)
  this.shouldAutoScroll = true
  // keep track of the scrollTop property here to avoid odd behavior when
  // changing scrollHeight while rerendering
  this.scrollTop = 0
  this.composerHeight = 48
}
inherits(Messages, BaseElement)

Messages.prototype.render = function (channel, users) {
  var self = this
  var childViews

  if (channel && channel.messages.length === 0) {
    var starterMessage = 'This is a new channel. Send a message to start things off!'
    childViews = h('.messages.starterMessage', starterMessage)
  } else {
    var messages = (channel ? channel.messages : []).map(function (msg) {
      var user = users[msg.username]
      if (user && user.blocked) return null

      var verified = !/Anonymous/i.test(msg.username) && msg.valid
      var userUrl = verified ? 'http://github.com/' + msg.username : '#'
      return h('li.message.clearfix', [
        h('img.avatar', { src: msg.avatar }),
        h(verified ? 'a.username' : '.username', { href: userUrl, style: {textDecoration: 'none', color: 'inherit' } }, msg.username),
        verified ? h('.verified') : null,
        h('.timestamp', msg.timeago),
        makeVDom(msg.html) || h('.text', msg.text)
      ])
    })
    childViews = h('.messages', {
      onscroll: function () {
        if (this.scrollHeight <= this.clientHeight + this.scrollTop) self.shouldAutoScroll = true
        else self.shouldAutoScroll = false
      },
      style: {
        paddingBottom: this.composerHeight
      },
      scrollTop: this.scrollTop
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
      leavableChannel ? h('button.button.leaveButton', {onclick: onleave}, 'Leave') : null
    ]),
    childViews
  ])
}

Messages.prototype.scrollToBottom = function (force) {
  if (!force && !this.shouldAutoScroll) return
  var messagesDiv = document.querySelector('.messages')
  if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
}

Messages.prototype.notifyComposerHeight = function (height) {
  var messagesDiv = document.querySelector('.messages')
  if (messagesDiv) {
    var heightChange = height - this.composerHeight
    this.scrollTop = messagesDiv.scrollTop + heightChange
  }

  this.composerHeight = height
}
