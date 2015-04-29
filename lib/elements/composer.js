module.exports = Composer

var h = require('virtual-dom/h')
var inherits = require('util').inherits
var uniq = require('lodash.uniq')
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

var TAB_KEY = 9
var ENTER_KEY = 13

Composer.prototype.render = function () {
  var self = this

  return h('textarea.composer', {
    onload: self,
    rows: 1,
    autofocus: true,
    onkeydown: function (e) {
      if (e.keyCode === TAB_KEY) {
        e.preventDefault()

        // if there are no matches try matching again
        if (!self.autocompleting.length) {
          self.resetAutocomplete()
          self.autocomplete(self.node.value)
        }

        if (self.autocompleting.length) {
          if (self.autocompleting[self.autocompleteIndex]) {
            self.node.value = self.autocompleting[self.autocompleteIndex] + ': '
          }

          self.autocompleteIndex = (self.autocompleteIndex + 1) % self.autocompleting.length
        }
      } else if (e.keyCode === ENTER_KEY && !e.shiftKey) {
        e.preventDefault()
        self.submit()
      }

      // reset the completions if the user submits or changes the text to be
      // completed
      if (e.keyCode !== TAB_KEY) {
        self.resetAutocomplete()
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

  this.autocompleting = uniq(this.autocompletes.filter(function (candidate) {
    return candidate.toLowerCase().indexOf(text.toLowerCase()) === 0
  }))
}

Composer.prototype.submit = function () {
  var self = this
  self.send('sendMessage', self.node.value)
  self.node.value = ''
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
