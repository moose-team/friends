module.exports = Messages

var inherits = require('util').inherits
var BaseElement = require('./base-element')
var yo = require('yo-yo')

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
  var childViews = renderChildViews.call(self, channel, users)

  function leaveChannel () {
    if (channel.name === 'friends') return null

    function onclick () {
      if (!channel || channel.name === 'friends') return
      self.send('leaveChannel', channel.name)
    }

    return yo`<button class="button leaveButton" onclick=${onclick}>Leave</button>`
  }

  var channelName = `#${channel ? channel.name : 'friends'}`
  var numPeers = yo`<small class="num-peers">${channel.peers} peer${channel.peers === 1 ? '' : 's'}</small>`

  return yo`
    <div class="messages-container">
      <div class="top-bar">
        <div class="channel-name">${channelName} ${numPeers}</div>
        ${leaveChannel()}
      </div>
      ${childViews}
    </div>
  `
}

function renderChildViews (channel, users) {
  if (channel && channel.messages.length === 0) {
    var starterMessage = 'This is a new channel. Send a message to start things off!'
    return yo`<div class="messages starterMessage">${starterMessage}</div>`
  }

  var self = this
  var messages = (channel ? channel.messages : []).map(function (msg) {
    var user = users[msg.username]
    if (user && user.blocked) return null

    var isVerified = !/Anonymous/i.test(msg.username) && msg.valid
    var userUrl = isVerified ? `http://github.com/${msg.username}` : '#'

    function avatar () {
      function onclick (e) {
        if (userUrl !== '#') { self.send('openUrl', userUrl) }
      }

      return yo`<img class="avatar" src="${msg.avatar}" onclick=${onclick} />`
    }

    function username () {
      return yo`<a href="${userUrl}" class="username">${msg.username}</a>`
    }

    function verified () {
      return isVerified ? yo`<span class="verified"></span>` : null
    }

    function timestamp () {
      return yo`<span class="timestamp">${msg.timeago}</span>`
    }

    function message () {
      var el = yo`<div class="text"></div>`
      el.innerHTML = msg.html || msg.text
      return el
    }

    return yo`
      <li class="message clearfix">
        ${avatar()}
        <div class="message-meta">
          ${username()}
          ${verified()}
          ${timestamp()}
        </div>
        ${message()}
      </li>
    `
  })

  function onscroll () {
    if (this.scrollHeight <= this.clientHeight + this.scrollTop) self.shouldAutoScroll = true
    else self.shouldAutoScroll = false
  }

  return yo`
    <div class="messages"
      onscroll=${onscroll}
      scrollTop=${this.scrollTop}
      style="padding-bottom: ${this.composerHeight}">
      ${messages}
    </div>
  `
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
