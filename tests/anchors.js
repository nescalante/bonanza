'use strict';

var test = require('tape');
var bonanza = require('../src');
var util = require('./util');

test('should include anchors if option is true', function (t) {
  var input = util.createInput();
  var b = createBasicList(input, { includeAnchors: true });
  var list;

  b.emit('focus');

  list = b.container.children[0];

  t.equal(list.children.length, 3);
  t.equal(list.children[0].innerHTML, '<a>foo</a>');
  t.equal(list.children[1].innerHTML, '<a>bar</a>');
  t.equal(list.children[2].innerHTML, '<a>baz</a>');

  t.end();
});

function createBasicList(input, options) {
  return bonanza(input, options, ['foo', 'bar', 'baz']);
}
