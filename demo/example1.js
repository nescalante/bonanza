'use strict';

var bonanza = require('../src');

module.exports = function () {
  bonanza(document.querySelector('#example1'), ['Bart', 'Lisa', 'Maggie']);
};
