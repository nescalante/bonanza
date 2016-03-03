'use strict';

var test = require('tape');
var bonanza = require('../src');
var util = require('./util');

test('required properties', function (t) {
  var input = util.createInput();

  t.throws(
    initializeWithoutElement,
    /An element is required to initialize bonanza/,
    'an element is required'
  );

  t.throws(
    initializeWithoutSource,
    /A source is required to initialize bonanza/,
    'a source is required'
  );

  t.ok(bonanza(input, ['some', 'items']), 'should initialize');

  t.end();

  function initializeWithoutElement() {
    bonanza();
  }

  function initializeWithoutSource() {
    bonanza(input);
  }
});
