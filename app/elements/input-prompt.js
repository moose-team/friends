module.exports = InputPrompt

var inherits = require('util').inherits
var BaseElement = require('./base-element')
var yo = require('yo-yo')

function InputPrompt (params) {
  BaseElement.call(this)
  if (!params.onsubmit) throw new Error('param `onsubmit` required')
  if (!params.prompt) throw new Error('param `prompt` required')

  this.params = params
  this.showInput = false
}
inherits(InputPrompt, BaseElement)

InputPrompt.prototype.render = function () {
  var self = this
  var view

  function onsubmit (e) {
    e.preventDefault()
    var input = this.querySelector('input')
    self.params.onsubmit(input.value)
    self.showInput = false
    self.params.onupdate()
  }

  function onblur (e) {
    self.showInput = false
    self.params.onupdate()
  }

  function onclick (e) {
    e.preventDefault()
    self.showInput = true
    self.params.onupdate()
  }

  if (self.showInput) {
    view = yo`
      <form class="inputprompt" onsubmit=${onsubmit}>
        <input
          type="text"
          placeholder="${self.params.placeholder}"
          onblur=${onblur}>
      </form>
    `
  } else {
    view = yo`<button onclick=${onclick}>${self.params.prompt}</button>`
  }

  self.node = yo`<div class="${this.params.className}">${view}</div>`

  return self.node
}
