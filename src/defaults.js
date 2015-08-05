'use strict';

var css = {
  container: 'bz-container',
  hide: 'bz-hide',
  list: 'bz-list',
  item: 'bz-list-item',
  loadMore: 'bz-list-load-more',
  selected: 'bz-list-item-selected',
  listLoading: 'bz-list-loading',
  loading: 'bz-loading',
  match: 'bz-text-match'
};

var templates = {
  item: '{{.}}',
  label: '{{{.}}}',
  noResults: 'No results',
  loadMore: '...',
  loading: 'Loading ...'
};

module.exports = {
  templates: templates,
  css: css,
  openOnFocus: true,
  limit: 10,
  hasMoreItems: function (result) { return !!result.length && result.length === this.limit; },
  queryTransform: function (query) { return query; },
  getItems: function (result) { return result; }
};
