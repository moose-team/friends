module.exports = TopBar

var h = require('virtual-dom/h')

function TopBar (params) {
  this.params = params
  this.showSidebar = true
}

TopBar.prototype.render = function (channel) {
  var activeChannel = channel || {}

  return h('div', { className: this.params.className }, [
    h('span', '#' + activeChannel.name)
  ])
}
