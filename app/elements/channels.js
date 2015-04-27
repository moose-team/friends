module.exports = Channels

var h = require('virtual-dom/h')

function Channels (params) {
  this.className = 'channels'
}

Channels.prototype.render = function (channels) {
  channels = channels.map(function (channel) {
    return h('li', {
      className: channel.active ? 'active' : ''
    }, [
      h('a', {
        href: '#',
        onclick: function () {
          window.alert('select channel! ' + channel.id) // eslint-disable-line
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
