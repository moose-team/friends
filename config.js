var applicationConfigPath = require('application-config-path')
var path = require('path')

var CONFIG_PATH = applicationConfigPath('Friends')
var ROOT_PATH = __dirname

module.exports = {
  APP_NAME: 'Friends',

  CONFIG_PATH: CONFIG_PATH,
  DB_PATH: path.join(CONFIG_PATH, 'friendsdb'),
  KEYS_PATH: path.join(CONFIG_PATH, 'public-keys'),

  INDEX: 'file://' + path.join(ROOT_PATH, 'index.html'),
  GIT_HELP: 'file://' + path.join(ROOT_PATH, 'app', 'windows', 'git-help.html')
}
