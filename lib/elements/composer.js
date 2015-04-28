module.exports = Composer

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var BaseElement = require('./base-element')

function Composer (target) {
  BaseElement.call(this, target)
  // List of words available to autocomplete
  this.autocompletes = []
  // Whether we should show the autocomplete box
  this.autocompleting = []
  // Which item in the autocomplete list we are selecting
  this.autocompleteIndex = 0
}
inherits(Composer, BaseElement)

Composer.prototype.render = function () {
  var self = this

  var textarea = h('textarea', {
    placeholder: 'Send a message...',
    autofocus: true,
    onkeydown: function (e) {
      if (e.which === 9) {
        e.preventDefault()
        if (self.autocompleting.length > 0) {
          if (self.autocompleting[self.autocompleteIndex]) {
            self.textarea.value = self.autocompleting[self.autocompleteIndex] + ': '
          }
          self.autocompleteIndex++
          if (self.autocompleteIndex >= self.autocompleting.length) {
            self.autocompleteIndex = 0
          }
        }
      }
    },
    onkeyup: function (e) {
      if (e.which !== 13) {
        self.autocomplete(self.textarea.value)
      }
    },
    onkeypress: function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault()
        self.submit()
      }
    }
  })

  return h('form.composer', {
    onload: self
  }, textarea)
}

Composer.prototype.autocomplete = function (text) {
  if (!text || text.length < 1) {
    this.resetAutocomplete()
    return
  }
  for (var i = 0; i < this.autocompletes.length; i++) {
    var val = this.autocompletes[i].toLowerCase()
    var lowerCaseText = text.toLowerCase()
    if (val.indexOf(lowerCaseText) === 0 && this.autocompleting.indexOf(this.autocompletes[i]) === -1) {
      this.autocompleting.push(this.autocompletes[i])
    }
  }
}

Composer.prototype.submit = function () {
  var self = this
  self.send('sendMessage', self.textarea.value)
  self.textarea.value = ''
  self.resetAutocomplete()
}

Composer.prototype.resetAutocomplete = function () {
  this.autocompleting = []
  this.autocompleteIndex = 0
}

Composer.prototype.hook = function (node) {
  var self = this
  self.form = node
  console.log(self.form)
  setTimeout(function () {
    self.textarea = self.form.querySelector('textarea')
    console.log(self.textarea)
  })
}
