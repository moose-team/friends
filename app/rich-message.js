module.exports = makeRichMessage

var autolinker = require('autolinker')
var emojiNamedCharacters = require('emoji-named-characters')
var htmlParser = require('html-parser')
var htmlToVDom = require('html-to-vdom')
var moment = require('moment')

var EMOJI_REGEX = /(\s|>|^)?:([A-z0-9_+]+):(\s|<|$)/g

var VNode = require('virtual-dom/vnode/vnode')
var VText = require('virtual-dom/vnode/vtext')

var convertHTML = htmlToVDom({
  VNode: VNode,
  VText: VText
})

function makeRichMessage (message) {
  message.anon = /Anonymous/i.test(message.username)
  message.avatar = message.anon
    ? 'static/Icon.png'
    : 'https://github.com/' + message.username + '.png'
  message.timeago = moment(message.timestamp).fromNow()

  message.text = htmlParser.sanitize(message.text, {
    elements: function (name) {
      return true
    },
    attributes: function (name) {
      return true
    },
    comments: true,
    doctype: true
  })

  message.text = message.text.replace(EMOJI_REGEX, function (full, $1, $2, $3) {
    return ($1 || '') + renderEmoji($2) + ($3 || '')
  })

  var messageHtml = autolinker.link(message.text)
  message.text = convertHTML('<span>' + messageHtml + '</span>')

  return message
}

function renderEmoji (emoji) {
  return emoji in emojiNamedCharacters ?
      '<img src="node_modules/emoji-named-characters/pngs/' + encodeURI(emoji) + '.png"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji" align="absmiddle" height="20" width="20">'
    : ':' + emoji + ':'
}
