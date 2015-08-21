'use strict';

var test = require('tape');
var bonanza = require('../src');
var utils = require('./utils.js')

test('required properties', function (t) {
  var input = utils.createInput();

  t.throws(function () { bonanza(); }, /An element is required to initialize bonanza/, 'an element is required');
  t.throws(function () { bonanza(input); }, /A source is required to initialize bonanza/, 'a source is required');
  t.ok(bonanza(input, ['some', 'items']));

  t.end();
});
