'use strict';

var test = require('tape');
var bonanza = require('../src');
var util = require('./util');

test('show list on focus', function (t) {
  var input = util.createInput();
  var b = createBasicList(input);
  var list;

  b.emit('focus');

  list = b.container.children[0];

  t.equal(list.children.length, 3);
  t.equal(list.children[0].innerHTML, 'foo');
  t.equal(list.children[1].innerHTML, 'bar');
  t.equal(list.children[2].innerHTML, 'baz');

  t.end();
});

test('show list on show', function (t) {
  var input = util.createInput();
  var b = createBasicList(input);

  t.equal(b.container.className, 'bz-container bz-hide');

  b.emit('show');

  t.equal(b.container.className, 'bz-container');

  t.end();
});

test('hide list on close', function (t) {
  var input = util.createInput();
  var b = createBasicList(input);
  var list;

  b.emit('focus');
  b.emit('close');

  list = b.container.children[0];
  t.equal(list.children.length, 0);
  t.equal(b.container.className, 'bz-container bz-hide');

  t.end();
});

test('update element value on change', function (t) {
  var input = util.createInput();
  var b = createBasicList(input);

  b.emit('change', 'foo');

  t.equal(input.value, 'foo');
  t.equal(b.container.className, 'bz-container bz-hide');

  t.end();
});

test('highlight item on select', function (t) {
  var input = util.createInput();
  var b = createBasicList(input);
  var list;

  b.emit('focus');
  b.emit('select', 'bar');

  list = b.container.children[0];

  t.equal(list.children[0].className, 'bz-list-item');
  t.equal(list.children[1].className, 'bz-list-item bz-list-item-selected');
  t.equal(list.children[2].className, 'bz-list-item');

  t.end();
});

test('escape special characters when highlighting after select', function (t) {
  var input = util.createInput();
  var b = bonanza(input, ['fo<>o', 'ba<svg onload=alert(1)>r']);
  var list;

  var items = [
    'fo<>o',
    'ba<svg onload=alert(1)>r'
  ];
  var query = {
    search: 'ba<svg onload=alert(1)>'
  };
  b.emit('success', items, query);

  list = b.container.children[0];

  t.equal(list.children[0].innerHTML, 'fo&lt;&gt;o');
  t.equal(list.children[1].innerHTML, '<span class="bz-text-match">ba&lt;svg onload=alert(1)&gt;</span>r');

  t.end();
});

function createBasicList(input) {
  return bonanza(input, ['foo', 'bar', 'baz']);
}
