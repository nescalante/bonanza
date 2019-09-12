'use strict';

var dom = require('./dom.js');
var render = require('./render.js');
var util = require('./util.js');

module.exports = {
  create: createList,
};

function createList(context, options) {
  var loadMore;
  var loading;
  var list;
  var noResults;
  var items = [];
  context.container.innerHTML = '<ul' +
    (options.css.list ? ' class="' + options.css.list + '"' : '') +
    ' id="' + options.controlListId + '" role="listbox"></ul>';
  list = context.container.children[0];

  return {
    push: pushItem,
    clean: cleanItems,
    items: items,
    getByData: getByData,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showLoadMore: showLoadMore,
    showNoResults: showNoResults,
    hasMoreItems: hasMoreItems,
  };

  function pushItem(info, search) {
    var regExp;
    var label;
    var innerHTML;
    var lastIndex;
    var matches;
    var isDisabled = options.templates.isDisabled(info);
    var itemClass = options.css.item + (isDisabled ? ' ' + options.css.disabled : '');
    var itemElem = appendElement(renderItemLabel, itemClass, info, options.controlListId, false);
    var item = { data: info, element: itemElem };

    itemElem.addEventListener('mousedown', function (e) {
      if (!isDisabled) {
        context.emit('change', info);
      }
    }, util.getPassiveOption());

    hideLoading();
    list.appendChild(itemElem);
    items.push(item);

    function renderItemLabel(item) {
      var itemLabel = options.templates.itemLabel(item);

      return options.templates.item(itemLabel, search, options);
    }
  }

  function cleanItems() {
    items.splice(0, items.length);
    list.innerHTML = '';
    loadMore = null;
    loading = null;
    noResults = null;
  }

  function getByData(data) {
    return items.filter(function (item) { return item.data === data; })[0];
  }

  function showLoading(query) {
    hideLoadMore();
    hideNoResults();

    if (!loading) {
      loading = appendElement(
        options.templates.loading,
        options.css.loading,
        query,
        options.controlListId,
        true
      );
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
      loadMore = appendAnchor(
        options.templates.loadMore,
        options.css.loadMore,
        result,
        options.controlListId
      );
    }

    if (!options.showLoadMore) {
      dom.addClass(loadMore, options.css.hide);
    }

    return loadMore;
  }

  function hideLoadMore() {
    if (loadMore) {
      list.removeChild(loadMore);
      loadMore = null;
    }
  }

  function showNoResults(result) {
    hideLoading();

    if (!loadMore) {
      noResults = appendElement(
        options.templates.noResults,
        options.css.noResults,
        result,
        options.controlListId,
        true
      );
    }
  }

  function hideNoResults() {
    if (noResults) {
      list.removeChild(noResults);
      noResults = null;
    }
  }

  function hasMoreItems() {
    return !!(loadMore || loading);
  }

  function appendElement(template, className, obj, controlListId, encode) {
    var element = document.createElement('li');
    element.innerHTML = render(template, obj, encode);
    element.className = className || '';
    element.setAttribute('id', controlListId + '-item-' + list.children.length);
    element.setAttribute('role', 'option');

    list.appendChild(element);

    return element;
  }

  function appendAnchor(template, className, obj, controlListId) {
    var element = document.createElement('li');
    var anchor = document.createElement('a');
    anchor.innerHTML = render(template, obj, true);
    anchor.addEventListener('mousedown', function () {
      context.emit('scrollbottom');
    }, util.getPassiveOption());

    element.className = className || '';
    element.setAttribute('id', controlListId + '-item-' + list.children.length);
    element.setAttribute('role', 'option');
    element.appendChild(anchor);

    list.appendChild(element);

    return element;
  }
}
