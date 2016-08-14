'use strict';

var test = require('tape');
var bonanza = require('../src');
var util = require('./util');

test('do search when typing', function (t) {
  var input = util.createInput();
  var b = bonanza(input, ['foo', 'bar', 'baz']);
  var list;

  util.keyUp(input, 'b');
  list = b.container.children[0];

  t.equal(list.children.length, 2);
  t.equal(list.children[0].innerHTML, '<span class="bz-text-match">b</span>ar');
  t.equal(list.children[1].innerHTML, '<span class="bz-text-match">b</span>az');

  t.end();
});

test('escape special characters when searching', function (t) {
  var input = util.createInput();
  var b = bonanza(input, ['<>', '?', '&']);
  var list;

  util.keyUp(input, '&');
  list = b.container.children[0];

  t.equal(list.children.length, 1);
  t.equal(list.children[0].innerHTML, '<span class="bz-text-match">&amp;</span>');

  t.end();
});
