'use strict';

var render = require('mustache').render;

module.exports = {
  create: createList
};

function createList(context, options) {
  var loadMore, loading, list;
  var items = [];
  context.container.innerHTML = '<ul class="' + options.css.list + '"></ul>';
  list = context.container.children[0];

  return {
    push: pushItem,
    clean: cleanItems,
    items: items,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showLoadMore: showLoadMore,
    isLoading: isLoading,
    hasMoreItems: hasMoreItems
  };

  function pushItem(info) {
    var itemElem = document.createElement('li');
    var item = { data: info, element: itemElem };
    itemElem.className = options.css.item;
    itemElem.innerHTML = render(options.templates.item, info);
    itemElem.addEventListener('mousedown', function (e) {
      context.emit('change', item);
    });

    list.appendChild(itemElem);
    items.push(item);
  }

  function cleanItems() {
    items.splice(0, items.length);
    list.innerHTML = '';
    loadMore = null;
    loading = null;
  }

  function showLoading(query) {
    if (loadMore) {
      list.removeChild(loadMore);
      loadMore = null;
    }

    if (!loading) {
      loading = document.createElement('li');
      loading.innerHTML = render(options.templates.loading, query);
      loading.className = options.css.listLoading;
      list.appendChild(loading);
    }

    return loading;
  }

  function hideLoading() {
    if (loading) {
      list.removeChild(loading);
      loading = null;
    }
  }

  function showLoadMore(result) {
    hideLoading();

    if (!loadMore) {
      loadMore = document.createElement('li');
      loadMore.innerHTML = render(options.templates.loadMore, result);
      loadMore.className = options.css.loadMore;
      list.appendChild(loadMore);
    }

    return loadMore;
  }

  function isLoading() {
    return !!loading;
  }

  function hasMoreItems() {
    return !!(loadMore || loading);
  }
}
