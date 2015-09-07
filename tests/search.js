'use strict';

var test = require('tape');
var bonanza = require('../src');
var utils = require('./utils.js')

test('do search when typing', function (t) {
  var input = utils.createInput();
  var b = bonanza(input, ['foo', 'bar', 'baz']);
  var list;

  utils.keyUp(input, 'b');
  list = b.container.children[0];

  t.equal(list.children.length, 2);
  t.equal(list.children[0].innerHTML, '<span class="bz-text-match">b</span>ar');
  t.equal(list.children[1].innerHTML, '<span class="bz-text-match">b</span>az');

  t.end();
});
