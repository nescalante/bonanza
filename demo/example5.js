'use strict';

var bonanza = require('../src');
var util = require('../src/util.js');
var list = require('./list.json');

module.exports = function () {
  var container = bonanza(document.querySelector('#example5'), { templates: { item: function(obj) { return obj.firstName + ' ' + obj.lastName; } } }, request);

  container.on('change', function (input) {
    alert(JSON.stringify(input));
  });
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .filter(function (item) {
        return util.queryRegExp(query.search).test(item.firstName + ' ' + item.lastName);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}
