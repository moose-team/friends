module.exports = Status

var h = require('virtual-dom/h')

function Status (app) {
  this.app = app
}

Status.prototype.render = function (data) {
  return h('.status', {
    onclick: function () {
      alert('click')
    }
  }, data.username)
}
