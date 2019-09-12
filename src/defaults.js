'use strict';

var util = require('./util.js');

var css = {
  container: 'bz-container',
  hide: 'bz-hide',
  list: 'bz-list',
  item: 'bz-list-item',
  disabled: 'bz-list-item-disabled',
  selected: 'bz-list-item-selected',
  loading: 'bz-list-loading',
  loadMore: 'bz-list-load-more',
  noResults: 'bz-list-no-results',
  inputLoading: 'bz-loading',
  match: 'bz-text-match',
};

var templates = {
  item: function (label, search, options) {
    if (!search) {
      return label;
    }

    var regExp = util.queryRegExp(search);
    var result = '';
    var matches;
    var lastIndex;

    while (matches = regExp.exec(label)) {
      result += util.encode(matches[1]);
      result += highlight(matches[2], options);
      lastIndex = regExp.lastIndex;
    }

    if (result) {
      result += util.encode(label.substr(lastIndex));
    } else {
      result += util.encode(label);
    }

    return result;
  },

  itemLabel: function (item) { return item; },

  label: function (label) { return label; },

  isDisabled: function (item) { return false; },

  noResults: function (obj) {
    return 'No results' + (obj && obj.search ? ' for "' + obj.search + '"' : '');
  },

  loadMore: '...',
  loading: 'Loading ...',
};

module.exports = {
  templates: templates,
  css: css,
  openOnFocus: true,
  closeOnBlur: true,
  showLoading: true,
  showloadMore: true,
  limit: 10,
  scrollDistance: 0,
  hasMoreItems: function (result) { return !!result.length && result.length === this.limit; },

  getItems: function (result) { return result; },
};

function highlight(str, options) {
  return '<span' +
    (options.css.match ? ' class="' + options.css.match + '"' : '') +
    '>' +
    util.encode(str) +
    '</span>';
}
