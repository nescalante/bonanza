'use strict';

var css = {
  container: 'bz-container',
  hide: 'bz-hide',
  list: 'bz-list',
  item: 'bz-list-item',
  selected: 'bz-list-item-selected',
  loading: 'bz-list-loading',
  loadMore: 'bz-list-load-more',
  noResults: 'bz-list-no-results',
  inputLoading: 'bz-loading',
  match: 'bz-text-match',
};

var templates = {
  item: '{{.}}',
  label: '{{.}}',
  noResults: 'No results {{#search}}for "{{/search}}{{search}}{{#search}}"{{/search}}',
  loadMore: '...',
  loading: 'Loading ...',
};

module.exports = {
  templates: templates,
  css: css,
  openOnFocus: true,
  showLoading: true,
  showloadMore: true,
  limit: 10,
  scrollDistance: 0,
  hasMoreItems: function (result) { return !!result.length && result.length === this.limit; },

  getItems: function (result) { return result; },

  closeOnBlur: true,
};
