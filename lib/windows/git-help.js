var delegate = require('delegate-dom')
var githubCurrentUser = require('github-current-user')

function AuthenticationHelp (el) {
  delegate.on(el, 'button', 'click', window.close)

  githubCurrentUser.verify(function (err, verified, username) {
    if (err) {
      var errorWrapperEl = el.querySelector('#error-wrapper')
      var errorEl = el.querySelector('#error')

      errorWrapperEl.style.display = 'block'
      errorEl.innerHTML = err
    }

    var usernameEl = el.querySelector('#username')
    var validKeyEl = el.querySelector('#valid-key')

    usernameEl.innerHTML = username || 'unknown'

    if (typeof verified !== 'undefined') {
      validKeyEl.innerHTML = verified
    } else {
      validKeyEl.innerHTML = ''
    }
  })
}

module.exports = window.AuthenticationHelp = AuthenticationHelp
