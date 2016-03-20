var BrowserWindow = require('browser-window')
var config = require('../config')
var app = require('app')

app.on('ready', appReady)

var mainWindow

function appReady () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: config.APP_NAME
  })

  mainWindow.loadURL(config.INDEX)

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}
