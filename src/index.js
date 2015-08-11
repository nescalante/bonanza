'use strict';

var EventEmitter = require('events').EventEmitter;
var dom = require('./dom.js');
var defaults = require('./defaults.js');
var keys = require('./keys.js');
var list = require('./list.js');
var render = require('./render.js');
var util = require('./util.js');

bonanza.defaults = defaults;
bonanza.render = render;
global.bonanza = bonanza;
module.exports = bonanza;

function bonanza(element, options, callback) {
  var array;

  if (!callback) {
    callback = options;
    options = {};
  }

  if (Array.isArray(callback)) {
    array = callback;
    callback = function (query, done) {
      var result = array
        .filter(function (item) {
          var desc = render(options.templates.label, item, false);

          return new RegExp(query.search, 'i').test(desc);
        })
        .slice(query.offset, query.offset + query.limit);

      done(null, result);
    };
  }

  if (options.templates) {
    if (options.templates.item && options.templates.label === undefined) {
      options.templates.label = options.templates.item;
    }

    options.templates = util.merge(defaults.templates, options.templates);
  }

  if (options.css) {
    options.css = util.merge(defaults.css, options.css);
  }

  options = util.merge(defaults, options);

  var context = new EventEmitter();
  var selectedItem, lastQuery, initialState;

  var container = document.createElement('div');
  container.className = options.css.container || '';
  element.parentNode.appendChild(container);
  dom.addClass(container, options.css.hide);

  context.container = container;
  context.input = element;
  context.options = options;

  var dataList = list.create(context, options);

  container.addEventListener('scroll', function (e) {
    var bottom = e.target.scrollTop + e.target.clientHeight - e.target.scrollHeight;

    if (bottom >= (-1 * options.scrollDistance) && dataList.hasMoreItems() && initialState) {
      context.emit('search', { offset: dataList.items.length, limit: options.limit, search: initialState.searchTerm });
    }
  });

  element.addEventListener('focus', function () {
    context.emit('focus');
  });

  context.on('focus', function () {
    if (options.openOnFocus) {
      process.nextTick(element.setSelectionRange.bind(element, 0, element.value.length));
      context.emit('search', { offset: 0, limit: options.limit, search: element.value });
    }
  });

  context.on('open', function () {
    dom.removeClass(container, options.css.hide);
    container.style.top = (element.offsetTop + element.offsetHeight) + 'px';
    container.style.left = (element.offsetLeft) + 'px';
  });

  context.on('change', function (item, elem) {
    if (item) {
      element.value = render(options.templates.label, item, false);
    }

    initialState = null;
    context.emit('close');
  });

  context.on('select', function (data, itemElem) {
    if (selectedItem) {
      dom.removeClass(selectedItem.element, options.css.selected);
    }

    if (data && itemElem) {
      selectedItem = { data: data, element: itemElem };
      element.value = render(options.templates.label, data, false);
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
      initialState = null;
    }

    context.emit('close');
  });

  context.on('close', function () {
    dataList.clean();
    dom.addClass(container, options.css.hide);
    lastQuery = null;
  });

  context.on('search', function (query) {
    if (lastQuery && lastQuery.search === query.search && lastQuery.offset === query.offset) {
      return;
    }

    if (query.offset === 0) {
      initialState = { oldValue: element.value, searchTerm: query.search };
    }

    if (!dataList.items.length && options.showLoading) {
      dataList.showLoading(query);
      context.emit('open');
    }
    else if (dataList.items.length && query.offset) {
      dataList.showLoading(query);
    }

    dom.addClass(element, options.css.inputLoading);
    lastQuery = query;
    callback(query, function (err, result) {
      if (err) {
        context.emit('error', err);
        return;
      }

      if (lastQuery === query) {
        if (query.offset === 0) {
          dataList.clean();
        }

        context.emit('success', result, query);
      }
    });
  });

  context.on('success', function (result, query) {
    var items = options.getItems(result);

    if (items) {
      context.emit('open');

      items.forEach(function (item) {
        dataList.push(item, query.search);
      });

      if (options.hasMoreItems(result)) {
        dataList.showLoadMore(result);
      }
      else if (!dataList.items.length) {
        dataList.showNoResults(query);
      }

      dataList.hideLoading();
    }
  });

  context.on('close', function () {
    dom.addClass(container, options.css.hide);
    selectedItem = null;
  });

  element.addEventListener('blur', function (e) {
    if (options.closeOnBlur) {
      context.emit('close');
    }
  });

  element.addEventListener('keyup', function (e) {
    if (!(e.keyCode.toString() in keys)) {
      context.emit('search', { offset: 0, limit: options.limit, search: element.value });
    }
  });

  element.addEventListener('keydown', function (e) {
    var lastIndex, nodeIndex;
    var key = keys[e.keyCode];

    context.emit('open');

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

      if (!dataList.items.length || (dataList.hasMoreItems() && nodeIndex >= dataList.items.length - 2)) {
        context.emit('search', { offset: dataList.items.length, limit: options.limit, search: initialState ? initialState.searchTerm : element.value });
      }

      if (dataList.items[nodeIndex]) {
        context.emit('select', dataList.items[nodeIndex].data, dataList.items[nodeIndex].element);
      }
    }

    else if (key === 'enter') {
      selectedItem = selectedItem || dataList.items[0];

      if (selectedItem) {
        context.emit('change', selectedItem.data, selectedItem.element);
      }
    }

    else if (key === 'escape') {
      context.emit('cancel');
    }
  });

  return context;
}
