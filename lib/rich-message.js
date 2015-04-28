module.exports = makeRichMessage
module.exports.mergeMessages = mergeMessages

var ghlink = require('ghlink')
var htmlToVDom = require('html-to-vdom')
var VNode = require('virtual-dom/vnode/vnode')
var VText = require('virtual-dom/vnode/vtext')
var util = require('./util.js')

var MarkdownIt = require('markdown-it')
var emoji = require('markdown-it-emoji')

var md = new MarkdownIt({
  linkify: true
}).use(emoji)

var convertHTML = htmlToVDom({
  VNode: VNode,
  VText: VText
})

function makeVDom (html) {
  return convertHTML('<div class="text">' + html + '</div>')
}

function makeRichMessage (message, username) {
  message.anon = /Anonymous/i.test(message.username)
  message.avatar = message.anon
    ? 'static/cat.png'
    : 'https://github.com/' + message.username + '.png'
  message.timeago = util.timeago(message.timestamp)

  message.html = md.render(message.text)
  message.html = ghlink(message.html, { format: 'html' })
  message.html = message.html.replace(/(^| )(#[a-zA-Z0-9]+)( |$)$/g, '$1<a href="$2">$2</a>$3')

  var highlight = (message.text.indexOf(username) !== -1)
  var classStr = highlight ? ' class="highlight"' : ''
  message.html = '<div' + classStr + '>' + message.html + '</div>'

  message.vdom = makeVDom(message.html)

  return message
}

function mergeMessages (message1, message2) {
  message1.text += '\n' + message2.text
  message1.html += '<p></p>' + message2.html
  message1.vdom = makeVDom(message1.html)
  return message1
}
