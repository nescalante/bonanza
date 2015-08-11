'use strict';

var bonanza = require('../src');
var list = require('./list.json');

module.exports = function () {
  var container = bonanza(document.querySelector('#example4'), { templates: { item: '{{firstName}} {{lastName}}' } }, request);

  container.on('change', function (input) {
    alert(JSON.stringify(input));
  });
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
