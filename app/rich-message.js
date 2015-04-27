module.exports = makeRichMessage

var emojiNamedCharacters = require('emoji-named-characters')

var EMOJI_REGEX = /(\s|>|^)?:([A-z0-9_+]+):(\s|<|$)/g

function makeRichMessage (message) {
  return message.replace(EMOJI_REGEX, function (full, $1, $2, $3) {
    return ($1 || '') + renderEmoji($2) + ($3 || '')
  })
}

function renderEmoji (emoji) {
  return emoji in emojiNamedCharacters ?
      '<img src="/node_modules/emoji-named-characters/pngs/' + encodeURI(emoji) + '.png"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji" align="absmiddle" height="20" width="20">'
    : ':' + emoji + ':'
}
