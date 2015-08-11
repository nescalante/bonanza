'use strict';

var bonanza = require('../src');
var list = require('./list.json');

module.exports = function () {
  bonanza(document.querySelector('#example3'), { templates: { item: '{{firstName}} {{lastName}}' } }, request);
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .filter(function (item) {
        return new RegExp(query.search, 'i').test(item.firstName + ' ' + item.lastName);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}
