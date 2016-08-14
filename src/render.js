'use strict';

var util = require('./util.js');

module.exports = render;

function render(template, model, encode) {
  var result;

  if (typeof template === 'function') {
    result = template(model);
  } else {
    result = template;
  }

  if (encode) {
    result = util.encode(result);
  }

  return result;
}
