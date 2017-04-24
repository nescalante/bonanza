(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = require('./src');

},{"./src":5}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
'use strict';

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
  item: function (item) { return item; },

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
  includeAnchors: false,
  limit: 10,
  scrollDistance: 0,
  hasMoreItems: function (result) { return !!result.length && result.length === this.limit; },

  getItems: function (result) { return result; },
};

},{}],4:[function(require,module,exports){
'use strict';

module.exports = {
  addClass: addClass,
  removeClass: removeClass,
  hasClass: hasClass,
};

function addClass(element, className) {
  if (!className) {
    return;
  }

  if (!hasClass(element, className)) {
    element.className = (element.className + (element.className ? ' ' : '') + className);
  }
}

function removeClass(element, className) {
  if (!className) {
    return;
  }

  var classRegex = new RegExp('\\b' + className + '\\b', 'g');
  element.className = element.className.replace(classRegex, '').replace(/  /g, ' ').trim();
}

function hasClass(element, className) {
  var classes = element.className.split(' ');

  return classes.indexOf(className) !== -1;
}

},{}],5:[function(require,module,exports){
(function (global){
'use strict';

var EventEmitter = require('events').EventEmitter;
var dom = require('./dom.js');
var defaults = require('./defaults.js');
var keys = require('./keys.js');
var list = require('./list.js');
var render = require('./render.js');
var util = require('./util.js');

bonanza.defaults = defaults;
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
    var isDisabled;
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
        isDisabled = options.templates.isDisabled(selectedItem.data);

        if (!isDisabled) {
          context.emit('change', selectedItem.data);
        }
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./defaults.js":3,"./dom.js":4,"./keys.js":6,"./list.js":7,"./render.js":8,"./util.js":9,"events":2}],6:[function(require,module,exports){
'use strict';

module.exports = {
  38: 'up',
  40: 'down',
  13: 'enter',
  27: 'escape',
};

},{}],7:[function(require,module,exports){
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
    '></ul>';
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
    var itemElem = appendElement(options.templates.item, options.css.item + (isDisabled ? ' ' + options.css.disabled : ''), info);
    var item = { data: info, element: itemElem };

    if (search) {
      label = options.templates.item(info);
      regExp = util.queryRegExp(search);
      innerHTML = '';

      while (matches = regExp.exec(label)) {
        innerHTML += util.encode(matches[1]);
        innerHTML += highlight(matches[2]);
        lastIndex = regExp.lastIndex;
      }

      if (innerHTML) {
        innerHTML += util.encode(label.substr(lastIndex));
      } else {
        innerHTML += util.encode(label);
      }

      itemElem.innerHTML = innerHTML;
    }

    if (options.includeAnchors) {
      itemElem.innerHTML = '<a>' + itemElem.innerHTML + '</a>';
    }

    itemElem.addEventListener('mousedown', function (e) {
      if (!isDisabled) {
        context.emit('change', info);
      }
    });

    hideLoading();
    list.appendChild(itemElem);
    items.push(item);
  }

  function highlight(str) {
    return '<span' +
      (options.css.match ? ' class="' + options.css.match + '"' : '') +
      '>' +
      str +
      '</span>';
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
      loading = appendElement(options.templates.loading, options.css.loading, query);
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
      loadMore = appendAnchor(options.templates.loadMore, options.css.loadMore, result);
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
      noResults = appendElement(options.templates.noResults, options.css.noResults, result);
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

  function appendElement(template, className, obj) {
    var element = document.createElement('li');
    element.innerHTML = render(template, obj, true);
    element.className = className || '';
    list.appendChild(element);

    return element;
  }

  function appendAnchor(template, className, obj) {
    var element = document.createElement('li');
    var anchor = document.createElement('a');
    anchor.innerHTML = render(template, obj, true);
    anchor.addEventListener('mousedown', function () {
      context.emit('scrollbottom');
    });

    element.className = className || '';
    element.appendChild(anchor);
    list.appendChild(element);

    return element;
  }
}

},{"./dom.js":4,"./render.js":8,"./util.js":9}],8:[function(require,module,exports){
'use strict';

var util = require('./util.js');

module.exports = render;

function render(template, model, encode) {
  var result;

  if (typeof template === 'function') {
    result = template(model);
  } else {
    result = template;
  }

  if (encode) {
    result = util.encode(result);
  }

  return result;
}

},{"./util.js":9}],9:[function(require,module,exports){
'use strict';

module.exports = {
  encode: encode,
  merge: merge,
  queryRegExp: queryRegExp,
};

function merge(obj1, obj2) {
  var result = {};
  var attr;

  for (attr in obj1) {
    result[attr] = obj1[attr];
  }

  for (attr in obj2) {
    result[attr] = obj2[attr];
  }

  return result;
}

function queryRegExp(query) {
  return new RegExp('(.*?)(' + escapeRegExp(query) + ')', 'ig');
}

function escapeRegExp(str) {
  return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function encode(str) {
  return str
   .replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#039;');
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib25hbnphLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJzcmMvZGVmYXVsdHMuanMiLCJzcmMvZG9tLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2tleXMuanMiLCJzcmMvbGlzdC5qcyIsInNyYy9yZW5kZXIuanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjJyk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjc3MgPSB7XG4gIGNvbnRhaW5lcjogJ2J6LWNvbnRhaW5lcicsXG4gIGhpZGU6ICdiei1oaWRlJyxcbiAgbGlzdDogJ2J6LWxpc3QnLFxuICBpdGVtOiAnYnotbGlzdC1pdGVtJyxcbiAgZGlzYWJsZWQ6ICdiei1saXN0LWl0ZW0tZGlzYWJsZWQnLFxuICBzZWxlY3RlZDogJ2J6LWxpc3QtaXRlbS1zZWxlY3RlZCcsXG4gIGxvYWRpbmc6ICdiei1saXN0LWxvYWRpbmcnLFxuICBsb2FkTW9yZTogJ2J6LWxpc3QtbG9hZC1tb3JlJyxcbiAgbm9SZXN1bHRzOiAnYnotbGlzdC1uby1yZXN1bHRzJyxcbiAgaW5wdXRMb2FkaW5nOiAnYnotbG9hZGluZycsXG4gIG1hdGNoOiAnYnotdGV4dC1tYXRjaCcsXG59O1xuXG52YXIgdGVtcGxhdGVzID0ge1xuICBpdGVtOiBmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gaXRlbTsgfSxcblxuICBsYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7IHJldHVybiBsYWJlbDsgfSxcblxuICBpc0Rpc2FibGVkOiBmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gZmFsc2U7IH0sXG5cbiAgbm9SZXN1bHRzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuICdObyByZXN1bHRzJyArIChvYmogJiYgb2JqLnNlYXJjaCA/ICcgZm9yIFwiJyArIG9iai5zZWFyY2ggKyAnXCInIDogJycpO1xuICB9LFxuXG4gIGxvYWRNb3JlOiAnLi4uJyxcbiAgbG9hZGluZzogJ0xvYWRpbmcgLi4uJyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB0ZW1wbGF0ZXM6IHRlbXBsYXRlcyxcbiAgY3NzOiBjc3MsXG4gIG9wZW5PbkZvY3VzOiB0cnVlLFxuICBjbG9zZU9uQmx1cjogdHJ1ZSxcbiAgc2hvd0xvYWRpbmc6IHRydWUsXG4gIHNob3dsb2FkTW9yZTogdHJ1ZSxcbiAgaW5jbHVkZUFuY2hvcnM6IGZhbHNlLFxuICBsaW1pdDogMTAsXG4gIHNjcm9sbERpc3RhbmNlOiAwLFxuICBoYXNNb3JlSXRlbXM6IGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICEhcmVzdWx0Lmxlbmd0aCAmJiByZXN1bHQubGVuZ3RoID09PSB0aGlzLmxpbWl0OyB9LFxuXG4gIGdldEl0ZW1zOiBmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiByZXN1bHQ7IH0sXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkQ2xhc3M6IGFkZENsYXNzLFxuICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG4gIGhhc0NsYXNzOiBoYXNDbGFzcyxcbn07XG5cbmZ1bmN0aW9uIGFkZENsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICBpZiAoIWNsYXNzTmFtZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gKGVsZW1lbnQuY2xhc3NOYW1lICsgKGVsZW1lbnQuY2xhc3NOYW1lID8gJyAnIDogJycpICsgY2xhc3NOYW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY2xhc3NSZWdleCA9IG5ldyBSZWdFeHAoJ1xcXFxiJyArIGNsYXNzTmFtZSArICdcXFxcYicsICdnJyk7XG4gIGVsZW1lbnQuY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUucmVwbGFjZShjbGFzc1JlZ2V4LCAnJykucmVwbGFjZSgvICAvZywgJyAnKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICB2YXIgY2xhc3NlcyA9IGVsZW1lbnQuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgcmV0dXJuIGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi9kZWZhdWx0cy5qcycpO1xudmFyIGtleXMgPSByZXF1aXJlKCcuL2tleXMuanMnKTtcbnZhciBsaXN0ID0gcmVxdWlyZSgnLi9saXN0LmpzJyk7XG52YXIgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXIuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmJvbmFuemEuZGVmYXVsdHMgPSBkZWZhdWx0cztcbmdsb2JhbC5ib25hbnphID0gYm9uYW56YTtcbm1vZHVsZS5leHBvcnRzID0gYm9uYW56YTtcblxuZnVuY3Rpb24gYm9uYW56YShlbGVtZW50LCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoIWVsZW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuIGVsZW1lbnQgaXMgcmVxdWlyZWQgdG8gaW5pdGlhbGl6ZSBib25hbnphJyk7XG4gIH1cblxuICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIGlmICghY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Egc291cmNlIGlzIHJlcXVpcmVkIHRvIGluaXRpYWxpemUgYm9uYW56YScpO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoY2FsbGJhY2spKSB7XG4gICAgY2FsbGJhY2sgPSBidWlsZENhbGxiYWNrRnJvbUFycmF5KGNhbGxiYWNrKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnRlbXBsYXRlcykge1xuICAgIGlmIChvcHRpb25zLnRlbXBsYXRlcy5pdGVtICYmIG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsID0gb3B0aW9ucy50ZW1wbGF0ZXMuaXRlbTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnRlbXBsYXRlcyA9IHV0aWwubWVyZ2UoZGVmYXVsdHMudGVtcGxhdGVzLCBvcHRpb25zLnRlbXBsYXRlcyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5jc3MpIHtcbiAgICBvcHRpb25zLmNzcyA9IHV0aWwubWVyZ2UoZGVmYXVsdHMuY3NzLCBvcHRpb25zLmNzcyk7XG4gIH1cblxuICBvcHRpb25zID0gdXRpbC5tZXJnZShkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgdmFyIGNvbnRleHQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHZhciBzZWxlY3RlZEl0ZW07XG4gIHZhciBsYXN0UXVlcnk7XG4gIHZhciBpbml0aWFsU3RhdGU7XG4gIHZhciBjdXJyZW50VmFsdWU7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuY2xhc3NOYW1lID0gb3B0aW9ucy5jc3MuY29udGFpbmVyIHx8ICcnO1xuICBlbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgZG9tLmFkZENsYXNzKGNvbnRhaW5lciwgb3B0aW9ucy5jc3MuaGlkZSk7XG5cbiAgY29udGV4dC5jb250YWluZXIgPSBjb250YWluZXI7XG4gIGNvbnRleHQuaW5wdXQgPSBlbGVtZW50O1xuICBjb250ZXh0Lm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHZhciBkYXRhTGlzdCA9IGxpc3QuY3JlYXRlKGNvbnRleHQsIG9wdGlvbnMpO1xuXG4gIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBib3R0b20gPSBlLnRhcmdldC5zY3JvbGxUb3AgKyBlLnRhcmdldC5jbGllbnRIZWlnaHQgLSBlLnRhcmdldC5zY3JvbGxIZWlnaHQ7XG5cbiAgICBpZiAoYm90dG9tID49ICgtMSAqIG9wdGlvbnMuc2Nyb2xsRGlzdGFuY2UpICYmIGRhdGFMaXN0Lmhhc01vcmVJdGVtcygpICYmIGluaXRpYWxTdGF0ZSkge1xuICAgICAgY29udGV4dC5lbWl0KCdzY3JvbGxib3R0b20nKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnRhaW5lci5vbm1vdXNld2hlZWwgPSBoYW5kbGVNb3VzZVdoZWVsO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dC5lbWl0KCdvcGVuJyk7XG4gIH0pO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKG9wdGlvbnMuY2xvc2VPbkJsdXIpIHtcbiAgICAgIGNvbnRleHQuZW1pdCgnY2xvc2UnKTtcbiAgICB9XG4gIH0pO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBrZXkgPSBrZXlzW2Uua2V5Q29kZV07XG5cbiAgICBpZiAoIWtleSkge1xuICAgICAgY29udGV4dC5lbWl0KCdzZWFyY2gnLCB7IG9mZnNldDogMCwgbGltaXQ6IG9wdGlvbnMubGltaXQsIHNlYXJjaDogZWxlbWVudC52YWx1ZSB9KTtcbiAgICB9IGVsc2UgaWYgKGtleSAhPT0gJ2VudGVyJykge1xuICAgICAgY3VycmVudFZhbHVlID0gbnVsbDtcbiAgICB9XG4gIH0pO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGxhc3RJbmRleDtcbiAgICB2YXIgbm9kZUluZGV4O1xuICAgIHZhciBpc0Rpc2FibGVkO1xuICAgIHZhciBrZXkgPSBrZXlzW2Uua2V5Q29kZV07XG5cbiAgICBpZiAoc2VsZWN0ZWRJdGVtKSB7XG4gICAgICBsYXN0SW5kZXggPSBkYXRhTGlzdC5pdGVtcy5pbmRleE9mKHNlbGVjdGVkSXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxhc3RJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgaWYgKGtleSA9PT0gJ3VwJykge1xuICAgICAgbm9kZUluZGV4ID0gKGxhc3RJbmRleCB8fCAwKSAtIDE7XG5cbiAgICAgIGlmIChub2RlSW5kZXggPT09IC0xICYmIGRhdGFMaXN0Lmhhc01vcmVJdGVtcygpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IDA7XG4gICAgICB9IGVsc2UgaWYgKG5vZGVJbmRleCA8IDApIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZGF0YUxpc3QuaXRlbXMubGVuZ3RoIC0gMTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGFMaXN0Lml0ZW1zLmxlbmd0aCkge1xuICAgICAgICBjb250ZXh0LmVtaXQoJ3NlbGVjdCcsIGRhdGFMaXN0Lml0ZW1zW25vZGVJbmRleF0uZGF0YSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdkb3duJykge1xuICAgICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgICBub2RlSW5kZXggPSBsYXN0SW5kZXggKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUluZGV4ID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKCFkYXRhTGlzdC5oYXNNb3JlSXRlbXMoKSAmJiBub2RlSW5kZXggPiBkYXRhTGlzdC5pdGVtcy5sZW5ndGggLSAxKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IDA7XG4gICAgICB9XG5cbiAgICAgIGlmICgoZGF0YUxpc3QuaGFzTW9yZUl0ZW1zKCkgJiYgbm9kZUluZGV4ID49IGRhdGFMaXN0Lml0ZW1zLmxlbmd0aCAtIDIpIHx8XG4gICAgICAgICFkYXRhTGlzdC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdzZWFyY2gnLCB7XG4gICAgICAgICAgb2Zmc2V0OiBkYXRhTGlzdC5pdGVtcy5sZW5ndGgsXG4gICAgICAgICAgbGltaXQ6IG9wdGlvbnMubGltaXQsXG4gICAgICAgICAgc2VhcmNoOiBpbml0aWFsU3RhdGUgPyBpbml0aWFsU3RhdGUuc2VhcmNoVGVybSA6IGVsZW1lbnQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YUxpc3QuaXRlbXNbbm9kZUluZGV4XSkge1xuICAgICAgICBjb250ZXh0LmVtaXQoJ3NlbGVjdCcsIGRhdGFMaXN0Lml0ZW1zW25vZGVJbmRleF0uZGF0YSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdlbnRlcicgJiYgaXNWaXNpYmxlKCkpIHtcbiAgICAgIHNlbGVjdGVkSXRlbSA9IHNlbGVjdGVkSXRlbSB8fCBkYXRhTGlzdC5pdGVtc1swXTtcblxuICAgICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgICBpc0Rpc2FibGVkID0gb3B0aW9ucy50ZW1wbGF0ZXMuaXNEaXNhYmxlZChzZWxlY3RlZEl0ZW0uZGF0YSk7XG5cbiAgICAgICAgaWYgKCFpc0Rpc2FibGVkKSB7XG4gICAgICAgICAgY29udGV4dC5lbWl0KCdjaGFuZ2UnLCBzZWxlY3RlZEl0ZW0uZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2VzY2FwZScgJiYgaXNWaXNpYmxlKCkpIHtcbiAgICAgIGNvbnRleHQuZW1pdCgnY2FuY2VsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG51bGw7XG4gICAgfVxuICB9KTtcblxuICBjb250ZXh0Lm9uKCdzY3JvbGxib3R0b20nLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dC5lbWl0KCdzZWFyY2gnLCB7XG4gICAgICBvZmZzZXQ6IGRhdGFMaXN0Lml0ZW1zLmxlbmd0aCxcbiAgICAgIGxpbWl0OiBvcHRpb25zLmxpbWl0LFxuICAgICAgc2VhcmNoOiBpbml0aWFsU3RhdGUuc2VhcmNoVGVybSxcbiAgICB9KTtcbiAgfSk7XG5cbiAgY29udGV4dC5vbignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dC5lbWl0KCdvcGVuJyk7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ29wZW4nLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKG9wdGlvbnMub3Blbk9uRm9jdXMpIHtcbiAgICAgIHNldFRpbWVvdXQoZWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZS5iaW5kKGVsZW1lbnQsIDAsIGVsZW1lbnQudmFsdWUubGVuZ3RoKSwgMCk7XG5cbiAgICAgIGlmICghY3VycmVudFZhbHVlKSB7XG4gICAgICAgIGNvbnRleHQuZW1pdCgnc2VhcmNoJywgeyBvZmZzZXQ6IDAsIGxpbWl0OiBvcHRpb25zLmxpbWl0LCBzZWFyY2g6IGVsZW1lbnQudmFsdWUgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBjb250ZXh0Lm9uKCdzaG93JywgZnVuY3Rpb24gKCkge1xuICAgIGRvbS5yZW1vdmVDbGFzcyhjb250YWluZXIsIG9wdGlvbnMuY3NzLmhpZGUpO1xuICAgIGNvbnRhaW5lci5zdHlsZS50b3AgPSAoZWxlbWVudC5vZmZzZXRUb3AgKyBlbGVtZW50Lm9mZnNldEhlaWdodCkgKyAncHgnO1xuICAgIGNvbnRhaW5lci5zdHlsZS5sZWZ0ID0gKGVsZW1lbnQub2Zmc2V0TGVmdCkgKyAncHgnO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdjbG9zZScsIGZ1bmN0aW9uICgpIHtcbiAgICBkYXRhTGlzdC5jbGVhbigpO1xuICAgIGRhdGFMaXN0LmhpZGVMb2FkaW5nKCk7XG4gICAgZG9tLnJlbW92ZUNsYXNzKGVsZW1lbnQsIG9wdGlvbnMuY3NzLmlucHV0TG9hZGluZyk7XG4gICAgZG9tLmFkZENsYXNzKGNvbnRhaW5lciwgb3B0aW9ucy5jc3MuaGlkZSk7XG4gICAgc2VsZWN0ZWRJdGVtID0gbnVsbDtcbiAgICBsYXN0UXVlcnkgPSBudWxsO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoaXRlbSkge1xuICAgIGN1cnJlbnRWYWx1ZSA9IGl0ZW07XG5cbiAgICBpZiAoaXRlbSkge1xuICAgICAgZWxlbWVudC52YWx1ZSA9IHJlbmRlcihvcHRpb25zLnRlbXBsYXRlcy5sYWJlbCwgaXRlbSwgZmFsc2UpO1xuICAgIH1cblxuICAgIGluaXRpYWxTdGF0ZSA9IG51bGw7XG4gICAgY29udGV4dC5lbWl0KCdjbG9zZScpO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdzZWxlY3QnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgIGlmIChzZWxlY3RlZEl0ZW0pIHtcbiAgICAgIGRvbS5yZW1vdmVDbGFzcyhzZWxlY3RlZEl0ZW0uZWxlbWVudCwgb3B0aW9ucy5jc3Muc2VsZWN0ZWQpO1xuICAgIH1cblxuICAgIHNlbGVjdGVkSXRlbSA9IGRhdGFMaXN0LmdldEJ5RGF0YShkYXRhKTtcblxuICAgIGlmIChzZWxlY3RlZEl0ZW0pIHtcbiAgICAgIGVsZW1lbnQudmFsdWUgPSByZW5kZXIob3B0aW9ucy50ZW1wbGF0ZXMubGFiZWwsIGRhdGEsIGZhbHNlKTtcbiAgICAgIGRvbS5hZGRDbGFzcyhzZWxlY3RlZEl0ZW0uZWxlbWVudCwgb3B0aW9ucy5jc3Muc2VsZWN0ZWQpO1xuICAgICAgdmFyIHRvcCA9IHNlbGVjdGVkSXRlbS5lbGVtZW50Lm9mZnNldFRvcDtcbiAgICAgIHZhciBib3R0b20gPSBzZWxlY3RlZEl0ZW0uZWxlbWVudC5vZmZzZXRUb3AgKyBzZWxlY3RlZEl0ZW0uZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG5cbiAgICAgIGlmIChib3R0b20gPiBjb250YWluZXIuY2xpZW50SGVpZ2h0ICsgY29udGFpbmVyLnNjcm9sbFRvcCkge1xuICAgICAgICBjb250YWluZXIuc2Nyb2xsVG9wID0gc2VsZWN0ZWRJdGVtLmVsZW1lbnQub2Zmc2V0VG9wIC1cbiAgICAgICAgICBjb250YWluZXIuY2xpZW50SGVpZ2h0ICtcbiAgICAgICAgICBzZWxlY3RlZEl0ZW0uZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKHRvcCA8IGNvbnRhaW5lci5zY3JvbGxUb3ApIHtcbiAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcCA9IHNlbGVjdGVkSXRlbS5lbGVtZW50Lm9mZnNldFRvcDtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ2NhbmNlbCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoaW5pdGlhbFN0YXRlKSB7XG4gICAgICBlbGVtZW50LnZhbHVlID0gaW5pdGlhbFN0YXRlLnNlYXJjaFRlcm07XG4gICAgICBjdXJyZW50VmFsdWUgPSBpbml0aWFsU3RhdGUub2xkVmFsdWU7XG4gICAgICBpbml0aWFsU3RhdGUgPSBudWxsO1xuICAgIH1cblxuICAgIGNvbnRleHQuZW1pdCgnY2xvc2UnKTtcbiAgfSk7XG5cbiAgY29udGV4dC5vbignc2VhcmNoJywgZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgaWYgKGxhc3RRdWVyeSAmJiBsYXN0UXVlcnkuc2VhcmNoID09PSBxdWVyeS5zZWFyY2ggJiYgbGFzdFF1ZXJ5Lm9mZnNldCA9PT0gcXVlcnkub2Zmc2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHF1ZXJ5Lm9mZnNldCA9PT0gMCkge1xuICAgICAgaW5pdGlhbFN0YXRlID0geyBvbGRWYWx1ZTogY3VycmVudFZhbHVlLCBzZWFyY2hUZXJtOiBxdWVyeS5zZWFyY2ggfTtcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5zaG93TG9hZGluZykge1xuICAgICAgZGF0YUxpc3Quc2hvd0xvYWRpbmcocXVlcnkpO1xuICAgICAgZG9tLmFkZENsYXNzKGVsZW1lbnQsIG9wdGlvbnMuY3NzLmlucHV0TG9hZGluZyk7XG4gICAgfVxuXG4gICAgc2hvd0xpc3QoKTtcblxuICAgIGxhc3RRdWVyeSA9IHF1ZXJ5O1xuICAgIGNhbGxiYWNrKHF1ZXJ5LCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGxhc3RRdWVyeSA9PT0gcXVlcnkpIHtcbiAgICAgICAgZGF0YUxpc3QuaGlkZUxvYWRpbmcoKTtcbiAgICAgICAgZG9tLnJlbW92ZUNsYXNzKGVsZW1lbnQsIG9wdGlvbnMuY3NzLmlucHV0TG9hZGluZyk7XG4gICAgICAgIGNvbnRleHQuZW1pdCgnc3VjY2VzcycsIHJlc3VsdCwgcXVlcnkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdzdWNjZXNzJywgZnVuY3Rpb24gKHJlc3VsdCwgcXVlcnkpIHtcbiAgICB2YXIgaXRlbXMgPSBvcHRpb25zLmdldEl0ZW1zKHJlc3VsdCk7XG5cbiAgICBpZiAocXVlcnkub2Zmc2V0ID09PSAwKSB7XG4gICAgICBkYXRhTGlzdC5jbGVhbigpO1xuICAgIH1cblxuICAgIGlmIChpdGVtcykge1xuICAgICAgc2hvd0xpc3QoKTtcblxuICAgICAgaXRlbXMuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICBkYXRhTGlzdC5wdXNoKGl0ZW0sIHF1ZXJ5LnNlYXJjaCk7XG4gICAgICB9KTtcblxuICAgICAgaWYgKG9wdGlvbnMuaGFzTW9yZUl0ZW1zKHJlc3VsdCkpIHtcbiAgICAgICAgZGF0YUxpc3Quc2hvd0xvYWRNb3JlKHJlc3VsdCk7XG4gICAgICB9IGVsc2UgaWYgKCFkYXRhTGlzdC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgZGF0YUxpc3Quc2hvd05vUmVzdWx0cyhxdWVyeSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29udGV4dDtcblxuICBmdW5jdGlvbiBpc1Zpc2libGUoKSB7XG4gICAgcmV0dXJuICFkb20uaGFzQ2xhc3MoY29udGFpbmVyLCBvcHRpb25zLmNzcy5oaWRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dMaXN0KCkge1xuICAgIGlmICghaXNWaXNpYmxlKCkpIHtcbiAgICAgIGNvbnRleHQuZW1pdCgnc2hvdycpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkQ2FsbGJhY2tGcm9tQXJyYXkoYXJyYXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHF1ZXJ5LCBkb25lKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gYXJyYXlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHZhciBkZXNjID0gcmVuZGVyKG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsLCBpdGVtLCBmYWxzZSk7XG5cbiAgICAgICAgICByZXR1cm4gdXRpbC5xdWVyeVJlZ0V4cChxdWVyeS5zZWFyY2gpLnRlc3QoZGVzYyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zbGljZShxdWVyeS5vZmZzZXQsIHF1ZXJ5Lm9mZnNldCArIHF1ZXJ5LmxpbWl0KTtcblxuICAgICAgZG9uZShudWxsLCByZXN1bHQpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZVdoZWVsKGUpIHtcbiAgICB2YXIgYm90dG9tID0gKGNvbnRhaW5lci5zY3JvbGxUb3AgKyBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbEhlaWdodCkgPT09IDA7XG4gICAgdmFyIHRvcCA9IGNvbnRhaW5lci5zY3JvbGxUb3AgPT09IDA7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YTtcblxuICAgIGlmICgoYm90dG9tICYmIGRpcmVjdGlvbiA8IDEpIHx8ICh0b3AgJiYgZGlyZWN0aW9uID4gMSkpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIDM4OiAndXAnLFxuICA0MDogJ2Rvd24nLFxuICAxMzogJ2VudGVyJyxcbiAgMjc6ICdlc2NhcGUnLFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvbSA9IHJlcXVpcmUoJy4vZG9tLmpzJyk7XG52YXIgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXIuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZUxpc3QsXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVMaXN0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgdmFyIGxvYWRNb3JlO1xuICB2YXIgbG9hZGluZztcbiAgdmFyIGxpc3Q7XG4gIHZhciBub1Jlc3VsdHM7XG4gIHZhciBpdGVtcyA9IFtdO1xuICBjb250ZXh0LmNvbnRhaW5lci5pbm5lckhUTUwgPSAnPHVsJyArXG4gICAgKG9wdGlvbnMuY3NzLmxpc3QgPyAnIGNsYXNzPVwiJyArIG9wdGlvbnMuY3NzLmxpc3QgKyAnXCInIDogJycpICtcbiAgICAnPjwvdWw+JztcbiAgbGlzdCA9IGNvbnRleHQuY29udGFpbmVyLmNoaWxkcmVuWzBdO1xuXG4gIHJldHVybiB7XG4gICAgcHVzaDogcHVzaEl0ZW0sXG4gICAgY2xlYW46IGNsZWFuSXRlbXMsXG4gICAgaXRlbXM6IGl0ZW1zLFxuICAgIGdldEJ5RGF0YTogZ2V0QnlEYXRhLFxuICAgIHNob3dMb2FkaW5nOiBzaG93TG9hZGluZyxcbiAgICBoaWRlTG9hZGluZzogaGlkZUxvYWRpbmcsXG4gICAgc2hvd0xvYWRNb3JlOiBzaG93TG9hZE1vcmUsXG4gICAgc2hvd05vUmVzdWx0czogc2hvd05vUmVzdWx0cyxcbiAgICBoYXNNb3JlSXRlbXM6IGhhc01vcmVJdGVtcyxcbiAgfTtcblxuICBmdW5jdGlvbiBwdXNoSXRlbShpbmZvLCBzZWFyY2gpIHtcbiAgICB2YXIgcmVnRXhwO1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgaW5uZXJIVE1MO1xuICAgIHZhciBsYXN0SW5kZXg7XG4gICAgdmFyIG1hdGNoZXM7XG4gICAgdmFyIGlzRGlzYWJsZWQgPSBvcHRpb25zLnRlbXBsYXRlcy5pc0Rpc2FibGVkKGluZm8pO1xuICAgIHZhciBpdGVtRWxlbSA9IGFwcGVuZEVsZW1lbnQob3B0aW9ucy50ZW1wbGF0ZXMuaXRlbSwgb3B0aW9ucy5jc3MuaXRlbSArIChpc0Rpc2FibGVkID8gJyAnICsgb3B0aW9ucy5jc3MuZGlzYWJsZWQgOiAnJyksIGluZm8pO1xuICAgIHZhciBpdGVtID0geyBkYXRhOiBpbmZvLCBlbGVtZW50OiBpdGVtRWxlbSB9O1xuXG4gICAgaWYgKHNlYXJjaCkge1xuICAgICAgbGFiZWwgPSBvcHRpb25zLnRlbXBsYXRlcy5pdGVtKGluZm8pO1xuICAgICAgcmVnRXhwID0gdXRpbC5xdWVyeVJlZ0V4cChzZWFyY2gpO1xuICAgICAgaW5uZXJIVE1MID0gJyc7XG5cbiAgICAgIHdoaWxlIChtYXRjaGVzID0gcmVnRXhwLmV4ZWMobGFiZWwpKSB7XG4gICAgICAgIGlubmVySFRNTCArPSB1dGlsLmVuY29kZShtYXRjaGVzWzFdKTtcbiAgICAgICAgaW5uZXJIVE1MICs9IGhpZ2hsaWdodChtYXRjaGVzWzJdKTtcbiAgICAgICAgbGFzdEluZGV4ID0gcmVnRXhwLmxhc3RJbmRleDtcbiAgICAgIH1cblxuICAgICAgaWYgKGlubmVySFRNTCkge1xuICAgICAgICBpbm5lckhUTUwgKz0gdXRpbC5lbmNvZGUobGFiZWwuc3Vic3RyKGxhc3RJbmRleCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5uZXJIVE1MICs9IHV0aWwuZW5jb2RlKGxhYmVsKTtcbiAgICAgIH1cblxuICAgICAgaXRlbUVsZW0uaW5uZXJIVE1MID0gaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmluY2x1ZGVBbmNob3JzKSB7XG4gICAgICBpdGVtRWxlbS5pbm5lckhUTUwgPSAnPGE+JyArIGl0ZW1FbGVtLmlubmVySFRNTCArICc8L2E+JztcbiAgICB9XG5cbiAgICBpdGVtRWxlbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFpc0Rpc2FibGVkKSB7XG4gICAgICAgIGNvbnRleHQuZW1pdCgnY2hhbmdlJywgaW5mbyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBoaWRlTG9hZGluZygpO1xuICAgIGxpc3QuYXBwZW5kQ2hpbGQoaXRlbUVsZW0pO1xuICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWdobGlnaHQoc3RyKSB7XG4gICAgcmV0dXJuICc8c3BhbicgK1xuICAgICAgKG9wdGlvbnMuY3NzLm1hdGNoID8gJyBjbGFzcz1cIicgKyBvcHRpb25zLmNzcy5tYXRjaCArICdcIicgOiAnJykgK1xuICAgICAgJz4nICtcbiAgICAgIHN0ciArXG4gICAgICAnPC9zcGFuPic7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhbkl0ZW1zKCkge1xuICAgIGl0ZW1zLnNwbGljZSgwLCBpdGVtcy5sZW5ndGgpO1xuICAgIGxpc3QuaW5uZXJIVE1MID0gJyc7XG4gICAgbG9hZE1vcmUgPSBudWxsO1xuICAgIGxvYWRpbmcgPSBudWxsO1xuICAgIG5vUmVzdWx0cyA9IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRCeURhdGEoZGF0YSkge1xuICAgIHJldHVybiBpdGVtcy5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHsgcmV0dXJuIGl0ZW0uZGF0YSA9PT0gZGF0YTsgfSlbMF07XG4gIH1cblxuICBmdW5jdGlvbiBzaG93TG9hZGluZyhxdWVyeSkge1xuICAgIGhpZGVMb2FkTW9yZSgpO1xuICAgIGhpZGVOb1Jlc3VsdHMoKTtcblxuICAgIGlmICghbG9hZGluZykge1xuICAgICAgbG9hZGluZyA9IGFwcGVuZEVsZW1lbnQob3B0aW9ucy50ZW1wbGF0ZXMubG9hZGluZywgb3B0aW9ucy5jc3MubG9hZGluZywgcXVlcnkpO1xuICAgIH1cblxuICAgIHJldHVybiBsb2FkaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUxvYWRpbmcoKSB7XG4gICAgaWYgKGxvYWRpbmcpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobG9hZGluZyk7XG4gICAgICBsb2FkaW5nID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93TG9hZE1vcmUocmVzdWx0KSB7XG4gICAgaGlkZUxvYWRpbmcoKTtcblxuICAgIGlmICghbG9hZE1vcmUpIHtcbiAgICAgIGxvYWRNb3JlID0gYXBwZW5kQW5jaG9yKG9wdGlvbnMudGVtcGxhdGVzLmxvYWRNb3JlLCBvcHRpb25zLmNzcy5sb2FkTW9yZSwgcmVzdWx0KTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdGlvbnMuc2hvd0xvYWRNb3JlKSB7XG4gICAgICBkb20uYWRkQ2xhc3MobG9hZE1vcmUsIG9wdGlvbnMuY3NzLmhpZGUpO1xuICAgIH1cblxuICAgIHJldHVybiBsb2FkTW9yZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVMb2FkTW9yZSgpIHtcbiAgICBpZiAobG9hZE1vcmUpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobG9hZE1vcmUpO1xuICAgICAgbG9hZE1vcmUgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dOb1Jlc3VsdHMocmVzdWx0KSB7XG4gICAgaGlkZUxvYWRpbmcoKTtcblxuICAgIGlmICghbG9hZE1vcmUpIHtcbiAgICAgIG5vUmVzdWx0cyA9IGFwcGVuZEVsZW1lbnQob3B0aW9ucy50ZW1wbGF0ZXMubm9SZXN1bHRzLCBvcHRpb25zLmNzcy5ub1Jlc3VsdHMsIHJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGlkZU5vUmVzdWx0cygpIHtcbiAgICBpZiAobm9SZXN1bHRzKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKG5vUmVzdWx0cyk7XG4gICAgICBub1Jlc3VsdHMgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc01vcmVJdGVtcygpIHtcbiAgICByZXR1cm4gISEobG9hZE1vcmUgfHwgbG9hZGluZyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRFbGVtZW50KHRlbXBsYXRlLCBjbGFzc05hbWUsIG9iaikge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHJlbmRlcih0ZW1wbGF0ZSwgb2JqLCB0cnVlKTtcbiAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZSB8fCAnJztcbiAgICBsaXN0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBlbmRBbmNob3IodGVtcGxhdGUsIGNsYXNzTmFtZSwgb2JqKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIHZhciBhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYW5jaG9yLmlubmVySFRNTCA9IHJlbmRlcih0ZW1wbGF0ZSwgb2JqLCB0cnVlKTtcbiAgICBhbmNob3IuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZnVuY3Rpb24gKCkge1xuICAgICAgY29udGV4dC5lbWl0KCdzY3JvbGxib3R0b20nKTtcbiAgICB9KTtcblxuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lIHx8ICcnO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYW5jaG9yKTtcbiAgICBsaXN0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7XG5cbmZ1bmN0aW9uIHJlbmRlcih0ZW1wbGF0ZSwgbW9kZWwsIGVuY29kZSkge1xuICB2YXIgcmVzdWx0O1xuXG4gIGlmICh0eXBlb2YgdGVtcGxhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXN1bHQgPSB0ZW1wbGF0ZShtb2RlbCk7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gdGVtcGxhdGU7XG4gIH1cblxuICBpZiAoZW5jb2RlKSB7XG4gICAgcmVzdWx0ID0gdXRpbC5lbmNvZGUocmVzdWx0KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBlbmNvZGU6IGVuY29kZSxcbiAgbWVyZ2U6IG1lcmdlLFxuICBxdWVyeVJlZ0V4cDogcXVlcnlSZWdFeHAsXG59O1xuXG5mdW5jdGlvbiBtZXJnZShvYmoxLCBvYmoyKSB7XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgdmFyIGF0dHI7XG5cbiAgZm9yIChhdHRyIGluIG9iajEpIHtcbiAgICByZXN1bHRbYXR0cl0gPSBvYmoxW2F0dHJdO1xuICB9XG5cbiAgZm9yIChhdHRyIGluIG9iajIpIHtcbiAgICByZXN1bHRbYXR0cl0gPSBvYmoyW2F0dHJdO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gcXVlcnlSZWdFeHAocXVlcnkpIHtcbiAgcmV0dXJuIG5ldyBSZWdFeHAoJyguKj8pKCcgKyBlc2NhcGVSZWdFeHAocXVlcnkpICsgJyknLCAnaWcnKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1stW1xcXXt9KCkqKz8uLFxcXFxeJHwjXFxzXS9nLCAnXFxcXCQmJyk7XG59XG5cbmZ1bmN0aW9uIGVuY29kZShzdHIpIHtcbiAgcmV0dXJuIHN0clxuICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgIC5yZXBsYWNlKC8nL2csICcmIzAzOTsnKTtcbn1cbiJdfQ==
