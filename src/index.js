'use strict';

var render = require('mustache').render;
var EventEmitter = require('events').EventEmitter;
var dom = require('./dom.js');
var defaults = require('./defaults.js');
var list = require('./list.js');
var keys = require('./keys.js');
var util = require('./util.js');

global.bonanza = bonanza;
module.exports = bonanza;

function bonanza(element, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  options = util.merge(defaults, options);

  var context = new EventEmitter();
  var selectedItem, lastQuery, initialState;

  var container = document.createElement('div');
  container.className = options.css.container;
  container.style.top = (element.offsetTop + element.offsetHeight) + 'px';
  container.style.left = (element.offsetLeft) + 'px';
  context.container = container;
  context.input = element;
  context.options = options;

  var dataList = list.create(context, options);

  container.addEventListener('scroll', function (e) {
    var bottom = e.target.scrollTop + e.target.clientHeight - e.target.scrollHeight;

    if (bottom >= 0 && dataList.hasMoreItems() && initialState) {
      context.emit('searchStart', { offset: dataList.items.length, limit: options.limit, search: initialState.searchTerm });
    }
  });

  element.addEventListener('focus', function () {
    context.emit('focus');
  });

  context.on('focus', function () {
    if (options.openOnFocus) {
      context.emit('searchStart', { offset: 0, limit: options.limit, search: element.value });
    }
  });

  context.on('change', function (item) {
    element.value = render(options.templates.label, item.data);
    context.emit('close');
  });

  context.on('select', function (data, itemElem) {
    if (selectedItem) {
      dom.removeClass(selectedItem.element, options.css.selected);
    }

    if (data && itemElem) {
      selectedItem = { data: data, element: itemElem };
      element.value = render(options.templates.label, data);
      dom.addClass(itemElem, options.css.selected);
      var top = itemElem.offsetTop;
      var bottom = itemElem.offsetTop + itemElem.offsetHeight;

      if (bottom > container.clientHeight + container.scrollTop) {
        container.scrollTop = itemElem.offsetTop - container.clientHeight + itemElem.offsetHeight;
      }
      else if (top < container.scrollTop) {
        container.scrollTop = itemElem.offsetTop;
      }
    }
  });

  context.on('cancel', function () {
    if (initialState) {
      element.value = initialState.searchTerm;
    }

    context.emit('close');
  });

  context.on('close', function () {
    dataList.clean();
    dom.addClass(container, options.css.hide);
    lastQuery = null;
  });

  context.on('searchStart', function (query) {
    var transQuery = options.queryTransform(query);

    if (lastQuery && lastQuery.search === query.search && lastQuery.offset === query.offset) {
      return;
    }

    if (query.offset === 0) {
      initialState = { oldValue: element.value, searchTerm: query.search };
      dataList.clean();
    }

    dataList.showLoading(transQuery);
    dom.removeClass(container, options.css.hide);
    dom.addClass(element, options.css.loading);
    lastQuery = query;
    callback(transQuery, function (err, result) {
      if (err) {
        context.emit('error', err);
        return;
      }

      if (lastQuery === query) {
        context.emit('searchSuccess', result);
      }
    });
  });

  context.on('searchSuccess', function (result) {
    var items = options.getItems(result);
    if (items) {
      dataList.hideLoading();

      items.forEach(function (item) {
        dataList.push(item);
      });

      if (options.hasMoreItems(result)) {
        dataList.showLoadMore(result);
      }
    }
  });

  context.on('close', function () {
    dom.addClass(container, options.css.hide);
    selectedItem = null;
  });

  element.addEventListener('blur', function (e) {
    context.emit('close');
  });

  element.addEventListener('keyup', function (e) {
    if (!(e.keyCode.toString() in keys)) {
      context.emit('searchStart', { offset: 0, limit: options.limit, search: element.value });
    }
  });

  element.addEventListener('keydown', function (e) {
    var lastIndex, nodeIndex;
    var key = keys[e.keyCode];

    dom.removeClass(container, options.css.hide);

    if (selectedItem) {
      lastIndex =  dataList.items.indexOf(dataList.items.filter(function (item) { return item.data === selectedItem.data; })[0]);
    }
    else {
      lastIndex = 0;
    }

    if (key === 'up') {
      nodeIndex = (lastIndex || 0) - 1;

      if (nodeIndex === -1 && dataList.hasMoreItems()) {
        nodeIndex = 0;
      }
      else if (nodeIndex < 0) {
        nodeIndex = dataList.items.length - 1;
      }

      context.emit('select', dataList.items[nodeIndex].data, dataList.items[nodeIndex].element);
    }

    else if (key === 'down') {
      if (selectedItem) {
        nodeIndex = lastIndex + 1;
      }
      else {
        nodeIndex = 0;
      }

      if (!dataList.hasMoreItems() && nodeIndex > dataList.items.length - 1) {
        nodeIndex = 0;
      }

      if (dataList.hasMoreItems() && nodeIndex >= dataList.items.length - 2) {
        context.emit('searchStart', { offset: dataList.items.length, limit: options.limit, search: initialState ? initialState.searchTerm : element.value });
      }

      if (dataList.items[nodeIndex]) {
        context.emit('select', dataList.items[nodeIndex].data, dataList.items[nodeIndex].element);
      }

    }

    else if (key === 'enter') {
      context.emit('change', selectedItem);
    }

    else if (key === 'escape') {
      context.emit('cancel');
    }
  });

  dom.addClass(container, options.css.hide);
  document.body.appendChild(container);

  return context;
}
