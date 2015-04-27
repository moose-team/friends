module.exports = Channels

var h = require('virtual-dom/h')
var InputPrompt = require('./input-prompt')

function Channels (app) {
  var self = this
  self.app = app

  self.addChannelPrompt = new InputPrompt({
    className: 'addChannel',
    prompt: '+ Add Channel',
    placeholder: 'Channel name',
    onsubmit: function (channelName) {
      self.app.emit('addChannel', channelName)
    }
  })
}

Channels.prototype.render = function (channels) {
  var self = this

  channels = channels.map(function (channel) {
    var className = channel.active ? 'active' : ''
    return h('li', { className: className }, [
      h('a', {
        href: '#',
        onclick: function () {
          self.app.emit('selectChannel', channel)
        }
      }, '#' + channel.name)
    ])
  })

  return [
    h('.heading', 'Channels'),
    h('ul', [
      channels
    ]),
    self.addChannelPrompt.render()
  ]
}
