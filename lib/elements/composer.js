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

  return h('textarea.composer', {
    onload: self,
    rows: 1,
    autofocus: true,
    onkeydown: function (e) {
      if (e.keyCode === 9) {
        e.preventDefault()
        if (self.autocompleting.length > 0) {
          if (self.autocompleting[self.autocompleteIndex]) {
            self.node.value = self.autocompleting[self.autocompleteIndex] + ': '
          }
          self.autocompleteIndex++
          if (self.autocompleteIndex >= self.autocompleting.length) {
            self.autocompleteIndex = 0
          }
        }
      } else if (e.keyCode === 13 && !e.shiftKey) {
        e.preventDefault()
        self.submit()
      }

      if (e.keyCode !== 13) {
        self.autocomplete(self.node.value)
      }
    },
    oninput: function () {
      self.resize()
    }
  })
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
  self.send('sendMessage', self.node.value)
  self.node.value = ''
  self.resetAutocomplete()
  self.resize()
}

Composer.prototype.resetAutocomplete = function () {
  this.autocompleting = []
  this.autocompleteIndex = 0
}

Composer.prototype.focus = function () {
  var self = this
  self.node.focus()
}

Composer.prototype.hook = function (node) {
  var self = this
  self.node = node

  // init for auto expander
  setTimeout(function () {
    var savedValue = self.node.value
    self.node.value = ''
    self.node.baseScrollHeight = self.node.scrollHeight
    self.node.value = savedValue
  })
}

Composer.prototype.resize = function () {
  this.node.rows = 1
  var rows = Math.ceil((this.node.scrollHeight - this.node.baseScrollHeight) / 17)
  this.node.rows = 1 + rows
}
