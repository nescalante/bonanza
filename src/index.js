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
  if (!element) {
    throw new Error('An element is required to initialize bonanza');
  }

  if (!callback) {
    callback = options;
    options = {};
  }

  if (!callback) {
    throw new Error('A source is required to initialize bonanza');
  }

  if (Array.isArray(callback)) {
    callback = buildCallbackFromArray(callback);
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
  var selectedItem;
  var lastQuery;
  var initialState;
  var currentValue;

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
      context.emit('scrollbottom');
    }
  });

  container.onmousewheel = handleMouseWheel;

  element.addEventListener('focus', function () {
    context.emit('open');
  });

  element.addEventListener('blur', function (e) {
    if (options.closeOnBlur) {
      context.emit('close');
    }
  });

  element.addEventListener('keyup', function (e) {
    var key = keys[e.keyCode];

    if (!key) {
      context.emit('search', { offset: 0, limit: options.limit, search: element.value });
    } else if (key !== 'enter') {
      currentValue = null;
    }
  });

  element.addEventListener('keydown', function (e) {
    var lastIndex;
    var nodeIndex;
    var key = keys[e.keyCode];

    if (selectedItem) {
      lastIndex = dataList.items.indexOf(selectedItem);
    } else {
      lastIndex = 0;
    }

    if (key === 'up') {
      nodeIndex = (lastIndex || 0) - 1;

      if (nodeIndex === -1 && dataList.hasMoreItems()) {
        nodeIndex = 0;
      } else if (nodeIndex < 0) {
        nodeIndex = dataList.items.length - 1;
      }

      if (dataList.items.length) {
        context.emit('select', dataList.items[nodeIndex].data);
      }
    } else if (key === 'down') {
      if (selectedItem) {
        nodeIndex = lastIndex + 1;
      } else {
        nodeIndex = 0;
      }

      if (!dataList.hasMoreItems() && nodeIndex > dataList.items.length - 1) {
        nodeIndex = 0;
      }

      if ((dataList.hasMoreItems() && nodeIndex >= dataList.items.length - 2) ||
        !dataList.items.length) {
        context.emit('search', {
          offset: dataList.items.length,
          limit: options.limit,
          search: initialState ? initialState.searchTerm : element.value,
        });
      }

      if (dataList.items[nodeIndex]) {
        context.emit('select', dataList.items[nodeIndex].data);
      }
    } else if (key === 'enter' && isVisible()) {
      selectedItem = selectedItem || dataList.items[0];

      if (selectedItem) {
        context.emit('change', selectedItem.data);
      }
    } else if (key === 'escape' && isVisible()) {
      context.emit('cancel');
    } else {
      currentValue = null;
    }
  });

  context.on('scrollbottom', function () {
    context.emit('search', {
      offset: dataList.items.length,
      limit: options.limit,
      search: initialState.searchTerm,
    });
  });

  context.on('focus', function () {
    context.emit('open');
  });

  context.on('open', function () {
    if (options.openOnFocus) {
      setTimeout(element.setSelectionRange.bind(element, 0, element.value.length), 0);

      if (!currentValue) {
        context.emit('search', { offset: 0, limit: options.limit, search: element.value });
      }
    }
  });

  context.on('show', function () {
    dom.removeClass(container, options.css.hide);
    container.style.top = (element.offsetTop + element.offsetHeight) + 'px';
    container.style.left = (element.offsetLeft) + 'px';
  });

  context.on('close', function () {
    dataList.clean();
    dataList.hideLoading();
    dom.removeClass(element, options.css.inputLoading);
    dom.addClass(container, options.css.hide);
    selectedItem = null;
    lastQuery = null;
  });

  context.on('change', function (item) {
    currentValue = item;

    if (item) {
      element.value = render(options.templates.label, item, false);
    }

    initialState = null;
    context.emit('close');
  });

  context.on('select', function (data) {
    if (selectedItem) {
      dom.removeClass(selectedItem.element, options.css.selected);
    }

    selectedItem = dataList.getByData(data);

    if (selectedItem) {
      element.value = render(options.templates.label, data, false);
      dom.addClass(selectedItem.element, options.css.selected);
      var top = selectedItem.element.offsetTop;
      var bottom = selectedItem.element.offsetTop + selectedItem.element.offsetHeight;

      if (bottom > container.clientHeight + container.scrollTop) {
        container.scrollTop = selectedItem.element.offsetTop -
          container.clientHeight +
          selectedItem.element.offsetHeight;
      } else if (top < container.scrollTop) {
        container.scrollTop = selectedItem.element.offsetTop;
      }
    }
  });

  context.on('cancel', function () {
    if (initialState) {
      element.value = initialState.searchTerm;
      currentValue = initialState.oldValue;
      initialState = null;
    }

    context.emit('close');
  });

  context.on('search', function (query) {
    if (lastQuery && lastQuery.search === query.search && lastQuery.offset === query.offset) {
      return;
    }

    if (query.offset === 0) {
      initialState = { oldValue: currentValue, searchTerm: query.search };
    }

    if (options.showLoading) {
      dataList.showLoading(query);
      dom.addClass(element, options.css.inputLoading);
    }

    showList();

    lastQuery = query;
    callback(query, function (err, result) {
      if (err) {
        context.emit('error', err);
        return;
      }

      if (lastQuery === query) {
        dataList.hideLoading();
        dom.removeClass(element, options.css.inputLoading);
        context.emit('success', result, query);
      }
    });
  });

  context.on('success', function (result, query) {
    var items = options.getItems(result);

    if (query.offset === 0) {
      dataList.clean();
    }

    if (items) {
      showList();

      items.forEach(function (item) {
        dataList.push(item, query.search);
      });

      if (options.hasMoreItems(result)) {
        dataList.showLoadMore(result);
      } else if (!dataList.items.length) {
        dataList.showNoResults(query);
      }
    }
  });

  return context;

  function isVisible() {
    return !dom.hasClass(container, options.css.hide);
  }

  function showList() {
    if (!isVisible()) {
      context.emit('show');
    }
  }

  function buildCallbackFromArray(array) {
    return function (query, done) {
      var result = array
        .filter(function (item) {
          var desc = render(options.templates.label, item, false);

          return util.queryRegExp(query.search).test(desc);
        })
        .slice(query.offset, query.offset + query.limit);

      done(null, result);
    };
  }

  function handleMouseWheel(e) {
    var bottom = (container.scrollTop + container.clientHeight - container.scrollHeight) === 0;
    var top = container.scrollTop === 0;
    var direction = e.wheelDelta;

    if ((bottom && direction < 1) || (top && direction > 1)) {
      e.stopPropagation();
      e.preventDefault();
      e.returnValue = false;

      return false;
    }
  }
}
