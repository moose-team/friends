function command (self) {
  return function (commandStr) {
    var words = commandStr.split(' ')
    var command = words[0].substring(1, words[0].length).toLowerCase()

    switch (command) {
      case 'join':
        words.shift()
        var channel = words.join(' ')
        self.emit('addChannel', channel)
        break
      case 'wc':
      case 'part':
      case 'leave':
        self.emit('leaveChannel', self.data.activeChannel.name)
        break
      case 'wcall':
      case 'partall':
      case 'leaveall':
        self.data.channels.forEach(function (channel) {
          self.emit('leaveChannel', channel.name)
        })
        break
      case 'alias':
        var aliasName = words[1]
        var aliasCommand = words.splice(2, words.length - 1).join(' ')
        db.aliases.put(aliasName, aliasCommand)
        break
      case 'rmalias':
        var aliasN = words[1]
        db.aliases.del(aliasN)
        break
      default:
        db.aliases.get(command, function (err, alias) {
        if (err == null) {
          self.emit('executeCommand', alias)
        } else {
          console.log('Unrecognized command: ' + command + ' (in "' + commandStr + '")')
          self.emit('sendMessage', commandStr)
        }
      })
      break
    }
  }
}

module.exports = command
