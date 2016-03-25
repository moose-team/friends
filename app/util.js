var moment = require('moment')

exports.timeago = function (milliseconds) {
  var timeago = moment(milliseconds).calendar()
  if (timeago.indexOf('Today at ') === 0) return timeago.substring(9)
  return timeago
}
