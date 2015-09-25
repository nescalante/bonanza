'use strict';

var test = require('tape');
var bonanza = require('../src');
var utils = require('./utils.js')

test('show list on focus', function (t) {
  var input = utils.createInput();
  var b = bonanza(input, ['foo', 'bar', 'baz']);
  var list;

  b.emit('focus');

  list = b.container.children[0];

  t.equal(list.children.length, 3);
  t.equal(list.children[0].innerHTML, 'foo');
  t.equal(list.children[1].innerHTML, 'bar');
  t.equal(list.children[2].innerHTML, 'baz');

  t.end();
});
