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
      default:
        console.log('Unrecognized command: ' + command + ' (in "' + commandStr + '")')
        self.emit('sendMessage', commandStr)
        break
    }
  }
}

module.exports = command
