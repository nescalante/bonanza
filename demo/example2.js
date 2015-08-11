'use strict';

var bonanza = require('../src');
var list = require('./list.json');

module.exports = function () {
  bonanza(document.querySelector('#example2'), request);
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .map(function (item) {
        return item.firstName + ' ' + item.lastName;
      })
      .filter(function (item) {
        return new RegExp(query.search, 'i').test(item);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}
