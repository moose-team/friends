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

  var input = h('input', {
    placeholder: 'Send a message...',
    autofocus: true,
    onkeydown: function (e) {
      if (e.keyCode === 9) {
        e.preventDefault()
        if (self.autocompleting.length > 0) {
          if (self.autocompleting[self.autocompleteIndex]) {
            this.value = self.autocompleting[self.autocompleteIndex]
          }
          self.autocompleteIndex++
          if (self.autocompleteIndex >= self.autocompleting.length) {
            self.autocompleteIndex = 0
          }
        }
      }
    },
    onkeyup: function (e) {
      self.autocomplete(this.value)
    }
  })

  return h('form.composer', {
    onsubmit: function (e) {
      e.preventDefault()
      var input = this.querySelector('input')
      self.send('sendMessage', input.value)
      input.value = ''
      self.resetAutocomplete()
    }
  }, input)
}

Composer.prototype.autocomplete = function (text) {
  if (!text || text.length < 1) {
    this.resetAutocomplete()
    return
  }
  for (var i = 0; i < this.autocompletes.length; i++) {
    var val = this.autocompletes[i].toLowerCase()
    var lowerCaseText = text.toLowerCase()
    if (val.indexOf(lowerCaseText) === 0) {
      this.autocompleting.push(this.autocompletes[i] + ': ')
    }
  }
}

Composer.prototype.resetAutocomplete = function () {
  this.autocompleting = []
  this.autocompleteIndex = 0
}
