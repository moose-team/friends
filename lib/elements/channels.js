module.exports = Channels

var InputPrompt = require('./input-prompt')
var inherits = require('util').inherits
var BaseElement = require('./base-element')
var yo = require('yo-yo')

function Channels (target) {
  var self = this
  BaseElement.call(this, target)

  self.addChannelPrompt = new InputPrompt({
    className: 'add-channel',
    prompt: '+ Join Channel',
    placeholder: 'Channel name',
    onsubmit: function (channelName) {
      self.send('addChannel', channelName)
    },
    onupdate: function () {
      self.send('render')
    }
  })
}
inherits(Channels, BaseElement)

Channels.prototype.render = function (channels) {
  var self = this

  channels = channels.map(function (channel) {
    var className = channel.active ? 'active' : ''

    function onclick () {
      self.send('selectChannel', channel.name)
    }

    return yo`
      <li class="${className}">
        <button onclick=${onclick}>#${channel.name}</button>
      </li>
    `
  })

  return yo`
    <div class="channels">
      <div class="heading">Channels</div>
      <ul>${channels}</ul>
      ${self.addChannelPrompt.render()}
    </div>
  `
}
