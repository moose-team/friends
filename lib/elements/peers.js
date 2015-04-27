module.exports = Peers

var h = require('virtual-dom/h')

function Peers (app) {
  this.app = app
}

Peers.prototype.render = function (data) {
  return h('.peers', 'Connected to ' + data.peers + ' peer' + (data.peers === 1 ? '' : 's'))
}
