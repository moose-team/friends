module.exports = Composer

var inherits = require('util').inherits
var uniq = require('lodash.uniq')
var BaseElement = require('./base-element')
var yo = require('yo-yo')

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

// the height taken up by padding, margin, border combined
Composer.prototype.minimumHeight = 48 // the default height of the composer element in pixels is one row + mimimum
Composer.prototype.defaultHeight = 17 + this.minimumHeight

Composer.prototype.render = function (data) {
  var self = this
  data = data || {}
  var ownUsername = data.username

  function onkeydown (e) {
    if (e.keyCode === TAB_KEY) {
      e.preventDefault()

      // if there are no matches try matching again
      if (!self.autocompleting.length) {
        self.resetAutocomplete()
        self.autocomplete(self.node.value, ownUsername)
      }

      self.insertAutocomplete(e.target)
    } else if (e.keyCode === ENTER_KEY && !e.shiftKey) {
      e.preventDefault()
      self.submit(e.target)
    }

    // reset the completions if the user submits or changes the text to be
    // completed
    if (e.keyCode !== TAB_KEY) {
      self.resetAutocomplete()
    }
  }

  function oninput (e) {
    self.resize(e.target)
  }

  self.node = yo`
    <textarea
      class="composer"
      aria-label="Enter a message and press enter"
      onload=${self}
      rows="1"
      onkeydown=${onkeydown}
      oninput=${oninput}
      autofocus></textarea>
  `

  this.initAutoExpander()

  return self.node
}

Composer.prototype.autocomplete = function (text, ownUsername) {
  if (!text || text.length < 1) {
    this.resetAutocomplete()
    return
  }

  this.autocompleting = uniq(this.autocompletes.filter(function (candidate) {
    return candidate.toLowerCase().indexOf(text.toLowerCase()) === 0 &&
      candidate.toLowerCase() !== ownUsername.toLowerCase()
  }))
}

Composer.prototype.submit = function (node) {
  var self = this
  if (node.value.charAt(0) === '/') {
    self.send('executeCommand', node.value)
  } else {
    self.send('sendMessage', node.value)
  }
  node.innerHTML = ''
  self.resize(node)
}

Composer.prototype.insertAutocomplete = function (node) {
  if (this.autocompleting.length < 1) return
  if (this.autocompleting[this.autocompleteIndex]) {
    node.value = this.autocompleting[this.autocompleteIndex] + ': '
  }
  this.autocompleteIndex = (this.autocompleteIndex + 1) % this.autocompleting.length
}

Composer.prototype.resetAutocomplete = function () {
  this.autocompleting = []
  this.autocompleteIndex = 0
}

Composer.prototype.focus = function () {
  this.node.focus()
}

Composer.prototype.initAutoExpander = function () {
  var self = this

  setTimeout(function () {
    var savedValue = self.node.value
    self.node.value = ''
    self.node.baseScrollHeight = self.node.scrollHeight
    self.node.value = savedValue
  })
}

Composer.prototype.resize = function () {
  var oldrows = this.node.rows
  this.node.rows = 1
  var rows = Math.ceil((this.node.scrollHeight - this.node.baseScrollHeight) / 17)
  this.node.rows = 1 + rows

  // only dispatch an event if the rows count actually changed
  if (oldrows !== this.node.rows) {
    this.send('resizeComposer', (rows * 17) + this.minimumHeight)
  }
}
