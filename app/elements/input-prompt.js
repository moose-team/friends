module.exports = InputPrompt

var h = require('virtual-dom/h')

function InputPrompt (params) {
  if (!params.onsubmit) throw new Error('param `onsubmit` required')
  if (!params.prompt) throw new Error('param `prompt` required')

  this.params = params

  this.showInput = false
}

InputPrompt.prototype.render = function () {
  var self = this

  var view
  if (self.showInput) {
    view = h('form', {
      onsubmit: function (e) {
        e.preventDefault()
        var input = this.querySelector('input')
        self.params.onsubmit(input.value)
        self.showInput = false
      }
    }, [
      h('input', {
        placeholder: self.params.placeholder,
        onload: self,
        onblur: function (e) {
          self.showInput = false
        }
      })
    ])

  } else {
    view = h('a', {
      href: '#',
      onclick: function (e) {
        e.preventDefault()
        self.showInput = true
      }
    }, self.params.prompt)
  }

  return h('div', { className: this.params.className }, view)
}

InputPrompt.prototype.hook = function (node) {
  setTimeout(function () {
    node.focus()
  })
}
