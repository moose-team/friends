var inherits = require('inherits')
var h = require('virtual-dom/h')

function Channels(params) {
  if (!(this instanceof Channels)) return new Channels(params)
  this.className = 'channels'
}
module.exports = Channels

Channels.prototype.render = function(channels) {
  channels = channels.map(function(channel) {
    return h('li', [
      h('button', {
        onclick: function() {
          alert('select channel! ' + channel.id)
        }
      }, [channel.name])
    ])
  })
  return h('ul', this, channels)
}
