module.exports = Desktop

var inherits = require('util').inherits
var App = require('./app.js')

var path = require('path')

var remote = require('remote')
var app = remote.require('app')
var shell = require('shell')
var BrowserWindow = remote.require('browser-window')
var currentWindow = remote.getCurrentWindow()

inherits(Desktop, App)

function Desktop () {
  if (!(this instanceof Desktop)) return new Desktop()
  App.call(this, document.body, currentWindow)
  var self = this

  // defensively remove all listeners as errors will occur on reload
  // see https://github.com/atom/electron/issues/3778
  remote.getCurrentWindow().removeAllListeners()

  // clear notifications on focus. TODO: only clear notifications in current channel when we have that
  currentWindow.on('focus', function () {
    self.setBadge(false)
  })

  this.on('showGitHelp', this.showGitHelp.bind(this))
  this.on('setBadge', this.setBadge.bind(this))
  this.on('openUrl', function (url) {
    shell.openExternal(url)
  })
}

Desktop.prototype.showGitHelp = function () {
  var GIT_HELP = 'file://' + path.join(__dirname, 'lib', 'windows', 'git-help.html')

  var gitHelp = new BrowserWindow({
    width: 600,
    height: 525,
    show: false,
    center: true,
    resizable: false
  })

  gitHelp.on('closed', function () {
    gitHelp = null
  })

  gitHelp.loadURL(GIT_HELP)

  gitHelp.show()
}

Desktop.prototype.setBadge = function (num) {
  if (!app.dock) return

  if (num === false) {
    return app.dock.setBadge('')
  } else if (num == null) {
    this._notifications++
  } else {
    this._notifications = num
  }
  app.dock.setBadge(this._notifications.toString())
}
