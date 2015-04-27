module.exports = Channels

var h = require('virtual-dom/h')

function Channels (app) {
  this.app = app
  this.className = 'channels'
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
    ])
  ]
}
