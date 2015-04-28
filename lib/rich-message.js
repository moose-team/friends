module.exports = makeRichMessage
module.exports.mergeMessages = mergeMessages

var emojiNamedCharacters = require('emoji-named-characters')
var ghlink = require('ghlink')
var htmlToVDom = require('html-to-vdom')
var MarkdownIt = require('markdown-it')
var VNode = require('virtual-dom/vnode/vnode')
var VText = require('virtual-dom/vnode/vtext')
var util = require('./util.js')

var EMOJI_REGEX = /(\s|>|^)?:([A-z0-9_+]+):(\s|<|$)/g

var md = new MarkdownIt({
  linkify: true
})
var convertHTML = htmlToVDom({
  VNode: VNode,
  VText: VText
})

function makeVDom (html) {
  return convertHTML('<div>' + html + '</div>')
}

function makeRichMessage (message) {
  message.anon = /Anonymous/i.test(message.username)
  message.avatar = message.anon
    ? 'static/cat.png'
    : 'https://github.com/' + message.username + '.png'
  message.timeago = util.timeago(message.timestamp)

  message.html = md.render(message.text)
  message.html = emojify(message.html)
  message.html = ghlink(message.html, { format: 'html' })
  message.html = message.html.replace(/(^| )(#[a-zA-Z0-9]+)( |$)$/g, '$1<a href="$2">$2</a>$3')
  message.vdom = makeVDom(message.html)

  return message
}

function emojify (str) {
  return str.replace(EMOJI_REGEX, function (full, $1, $2, $3) {
    return ($1 || '') + renderEmoji($2) + ($3 || '')
  })
}

function renderEmoji (emoji) {
  return emoji in emojiNamedCharacters ?
      '<img src="node_modules/emoji-named-characters/pngs/' + encodeURI(emoji) + '.png"'
      + ' alt=":' + escape(emoji) + ':"'
      + ' title=":' + escape(emoji) + ':"'
      + ' class="emoji" align="absmiddle" height="20" width="20">'
    : ':' + emoji + ':'
}

function mergeMessages (message1, message2) {
  message1.text += '\n' + message2.text
  message1.html += '<p></p>' + message2.html
  message1.vdom = makeVDom(message1.html)
  return message1
}
