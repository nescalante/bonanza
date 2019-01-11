(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
  }, util.getPassiveOption());

  container.onmousewheel = handleMouseWheel;

  element.addEventListener('focus', function () {
    context.emit('open');
  }, util.getPassiveOption());

  element.addEventListener('blur', function (e) {
    if (options.closeOnBlur) {
      context.emit('close');
    }
  }, util.getPassiveOption());

  element.addEventListener('keyup', function (e) {
    var key = keys[e.keyCode];

    if (!key) {
      context.emit('search', { offset: 0, limit: options.limit, search: element.value });
    } else if (key !== 'enter') {
      currentValue = null;
    }
  }, util.getPassiveOption());

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
  }, util.getPassiveOption());

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
    } else {
      context.emit('close');
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
    var itemClass = options.css.item + (isDisabled ? ' ' + options.css.disabled : '');
    var itemElem = appendElement(options.templates.item, itemClass, info);
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
    }, util.getPassiveOption());

    hideLoading();
    list.appendChild(itemElem);
    items.push(item);
  }

  function highlight(str) {
    return '<span' +
      (options.css.match ? ' class="' + options.css.match + '"' : '') +
      '>' +
      util.encode(str) +
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
    }, util.getPassiveOption());

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

var supportsPassive = false;

try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function getPassiveSupport() {
      supportsPassive = true;
    },
  });
  window.addEventListener('testPassive', null, opts);
  window.removeEventListener('testPassive', null, opts);
} catch (e) {}

module.exports = {
  encode: encode,
  merge: merge,
  queryRegExp: queryRegExp,
  getPassiveOption: getPassiveOption,
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

function getPassiveOption() {
  return supportsPassive ? { passive: true } : false;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib25hbnphLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJzcmMvZGVmYXVsdHMuanMiLCJzcmMvZG9tLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2tleXMuanMiLCJzcmMvbGlzdC5qcyIsInNyYy9yZW5kZXIuanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjJyk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXQgbGVhc3QgZ2l2ZSBzb21lIGtpbmQgb2YgY29udGV4dCB0byB0aGUgdXNlclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LiAoJyArIGVyICsgJyknKTtcbiAgICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2UgaWYgKGxpc3RlbmVycykge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgaWYgKHRoaXMuX2V2ZW50cykge1xuICAgIHZhciBldmxpc3RlbmVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gICAgaWYgKGlzRnVuY3Rpb24oZXZsaXN0ZW5lcikpXG4gICAgICByZXR1cm4gMTtcbiAgICBlbHNlIGlmIChldmxpc3RlbmVyKVxuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHJldHVybiBlbWl0dGVyLmxpc3RlbmVyQ291bnQodHlwZSk7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjc3MgPSB7XG4gIGNvbnRhaW5lcjogJ2J6LWNvbnRhaW5lcicsXG4gIGhpZGU6ICdiei1oaWRlJyxcbiAgbGlzdDogJ2J6LWxpc3QnLFxuICBpdGVtOiAnYnotbGlzdC1pdGVtJyxcbiAgZGlzYWJsZWQ6ICdiei1saXN0LWl0ZW0tZGlzYWJsZWQnLFxuICBzZWxlY3RlZDogJ2J6LWxpc3QtaXRlbS1zZWxlY3RlZCcsXG4gIGxvYWRpbmc6ICdiei1saXN0LWxvYWRpbmcnLFxuICBsb2FkTW9yZTogJ2J6LWxpc3QtbG9hZC1tb3JlJyxcbiAgbm9SZXN1bHRzOiAnYnotbGlzdC1uby1yZXN1bHRzJyxcbiAgaW5wdXRMb2FkaW5nOiAnYnotbG9hZGluZycsXG4gIG1hdGNoOiAnYnotdGV4dC1tYXRjaCcsXG59O1xuXG52YXIgdGVtcGxhdGVzID0ge1xuICBpdGVtOiBmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gaXRlbTsgfSxcblxuICBsYWJlbDogZnVuY3Rpb24gKGxhYmVsKSB7IHJldHVybiBsYWJlbDsgfSxcblxuICBpc0Rpc2FibGVkOiBmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gZmFsc2U7IH0sXG5cbiAgbm9SZXN1bHRzOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuICdObyByZXN1bHRzJyArIChvYmogJiYgb2JqLnNlYXJjaCA/ICcgZm9yIFwiJyArIG9iai5zZWFyY2ggKyAnXCInIDogJycpO1xuICB9LFxuXG4gIGxvYWRNb3JlOiAnLi4uJyxcbiAgbG9hZGluZzogJ0xvYWRpbmcgLi4uJyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB0ZW1wbGF0ZXM6IHRlbXBsYXRlcyxcbiAgY3NzOiBjc3MsXG4gIG9wZW5PbkZvY3VzOiB0cnVlLFxuICBjbG9zZU9uQmx1cjogdHJ1ZSxcbiAgc2hvd0xvYWRpbmc6IHRydWUsXG4gIHNob3dsb2FkTW9yZTogdHJ1ZSxcbiAgaW5jbHVkZUFuY2hvcnM6IGZhbHNlLFxuICBsaW1pdDogMTAsXG4gIHNjcm9sbERpc3RhbmNlOiAwLFxuICBoYXNNb3JlSXRlbXM6IGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICEhcmVzdWx0Lmxlbmd0aCAmJiByZXN1bHQubGVuZ3RoID09PSB0aGlzLmxpbWl0OyB9LFxuXG4gIGdldEl0ZW1zOiBmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiByZXN1bHQ7IH0sXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkQ2xhc3M6IGFkZENsYXNzLFxuICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG4gIGhhc0NsYXNzOiBoYXNDbGFzcyxcbn07XG5cbmZ1bmN0aW9uIGFkZENsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICBpZiAoIWNsYXNzTmFtZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICghaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSkge1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gKGVsZW1lbnQuY2xhc3NOYW1lICsgKGVsZW1lbnQuY2xhc3NOYW1lID8gJyAnIDogJycpICsgY2xhc3NOYW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgaWYgKCFjbGFzc05hbWUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgY2xhc3NSZWdleCA9IG5ldyBSZWdFeHAoJ1xcXFxiJyArIGNsYXNzTmFtZSArICdcXFxcYicsICdnJyk7XG4gIGVsZW1lbnQuY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUucmVwbGFjZShjbGFzc1JlZ2V4LCAnJykucmVwbGFjZSgvICAvZywgJyAnKS50cmltKCk7XG59XG5cbmZ1bmN0aW9uIGhhc0NsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICB2YXIgY2xhc3NlcyA9IGVsZW1lbnQuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG5cbiAgcmV0dXJuIGNsYXNzZXMuaW5kZXhPZihjbGFzc05hbWUpICE9PSAtMTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xudmFyIGRlZmF1bHRzID0gcmVxdWlyZSgnLi9kZWZhdWx0cy5qcycpO1xudmFyIGtleXMgPSByZXF1aXJlKCcuL2tleXMuanMnKTtcbnZhciBsaXN0ID0gcmVxdWlyZSgnLi9saXN0LmpzJyk7XG52YXIgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXIuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmJvbmFuemEuZGVmYXVsdHMgPSBkZWZhdWx0cztcbmdsb2JhbC5ib25hbnphID0gYm9uYW56YTtcbm1vZHVsZS5leHBvcnRzID0gYm9uYW56YTtcblxuZnVuY3Rpb24gYm9uYW56YShlbGVtZW50LCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoIWVsZW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0FuIGVsZW1lbnQgaXMgcmVxdWlyZWQgdG8gaW5pdGlhbGl6ZSBib25hbnphJyk7XG4gIH1cblxuICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSB7fTtcbiAgfVxuXG4gIGlmICghY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Egc291cmNlIGlzIHJlcXVpcmVkIHRvIGluaXRpYWxpemUgYm9uYW56YScpO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoY2FsbGJhY2spKSB7XG4gICAgY2FsbGJhY2sgPSBidWlsZENhbGxiYWNrRnJvbUFycmF5KGNhbGxiYWNrKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnRlbXBsYXRlcykge1xuICAgIGlmIChvcHRpb25zLnRlbXBsYXRlcy5pdGVtICYmIG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsID0gb3B0aW9ucy50ZW1wbGF0ZXMuaXRlbTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnRlbXBsYXRlcyA9IHV0aWwubWVyZ2UoZGVmYXVsdHMudGVtcGxhdGVzLCBvcHRpb25zLnRlbXBsYXRlcyk7XG4gIH1cblxuICBpZiAob3B0aW9ucy5jc3MpIHtcbiAgICBvcHRpb25zLmNzcyA9IHV0aWwubWVyZ2UoZGVmYXVsdHMuY3NzLCBvcHRpb25zLmNzcyk7XG4gIH1cblxuICBvcHRpb25zID0gdXRpbC5tZXJnZShkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgdmFyIGNvbnRleHQgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIHZhciBzZWxlY3RlZEl0ZW07XG4gIHZhciBsYXN0UXVlcnk7XG4gIHZhciBpbml0aWFsU3RhdGU7XG4gIHZhciBjdXJyZW50VmFsdWU7XG5cbiAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBjb250YWluZXIuY2xhc3NOYW1lID0gb3B0aW9ucy5jc3MuY29udGFpbmVyIHx8ICcnO1xuICBlbGVtZW50LnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcbiAgZG9tLmFkZENsYXNzKGNvbnRhaW5lciwgb3B0aW9ucy5jc3MuaGlkZSk7XG5cbiAgY29udGV4dC5jb250YWluZXIgPSBjb250YWluZXI7XG4gIGNvbnRleHQuaW5wdXQgPSBlbGVtZW50O1xuICBjb250ZXh0Lm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gIHZhciBkYXRhTGlzdCA9IGxpc3QuY3JlYXRlKGNvbnRleHQsIG9wdGlvbnMpO1xuXG4gIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBib3R0b20gPSBlLnRhcmdldC5zY3JvbGxUb3AgKyBlLnRhcmdldC5jbGllbnRIZWlnaHQgLSBlLnRhcmdldC5zY3JvbGxIZWlnaHQ7XG5cbiAgICBpZiAoYm90dG9tID49ICgtMSAqIG9wdGlvbnMuc2Nyb2xsRGlzdGFuY2UpICYmIGRhdGFMaXN0Lmhhc01vcmVJdGVtcygpICYmIGluaXRpYWxTdGF0ZSkge1xuICAgICAgY29udGV4dC5lbWl0KCdzY3JvbGxib3R0b20nKTtcbiAgICB9XG4gIH0sIHV0aWwuZ2V0UGFzc2l2ZU9wdGlvbigpKTtcblxuICBjb250YWluZXIub25tb3VzZXdoZWVsID0gaGFuZGxlTW91c2VXaGVlbDtcblxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQuZW1pdCgnb3BlbicpO1xuICB9LCB1dGlsLmdldFBhc3NpdmVPcHRpb24oKSk7XG5cbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAob3B0aW9ucy5jbG9zZU9uQmx1cikge1xuICAgICAgY29udGV4dC5lbWl0KCdjbG9zZScpO1xuICAgIH1cbiAgfSwgdXRpbC5nZXRQYXNzaXZlT3B0aW9uKCkpO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBrZXkgPSBrZXlzW2Uua2V5Q29kZV07XG5cbiAgICBpZiAoIWtleSkge1xuICAgICAgY29udGV4dC5lbWl0KCdzZWFyY2gnLCB7IG9mZnNldDogMCwgbGltaXQ6IG9wdGlvbnMubGltaXQsIHNlYXJjaDogZWxlbWVudC52YWx1ZSB9KTtcbiAgICB9IGVsc2UgaWYgKGtleSAhPT0gJ2VudGVyJykge1xuICAgICAgY3VycmVudFZhbHVlID0gbnVsbDtcbiAgICB9XG4gIH0sIHV0aWwuZ2V0UGFzc2l2ZU9wdGlvbigpKTtcblxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBsYXN0SW5kZXg7XG4gICAgdmFyIG5vZGVJbmRleDtcbiAgICB2YXIgaXNEaXNhYmxlZDtcbiAgICB2YXIga2V5ID0ga2V5c1tlLmtleUNvZGVdO1xuXG4gICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgbGFzdEluZGV4ID0gZGF0YUxpc3QuaXRlbXMuaW5kZXhPZihzZWxlY3RlZEl0ZW0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0SW5kZXggPSAwO1xuICAgIH1cblxuICAgIGlmIChrZXkgPT09ICd1cCcpIHtcbiAgICAgIG5vZGVJbmRleCA9IChsYXN0SW5kZXggfHwgMCkgLSAxO1xuXG4gICAgICBpZiAobm9kZUluZGV4ID09PSAtMSAmJiBkYXRhTGlzdC5oYXNNb3JlSXRlbXMoKSkge1xuICAgICAgICBub2RlSW5kZXggPSAwO1xuICAgICAgfSBlbHNlIGlmIChub2RlSW5kZXggPCAwKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IGRhdGFMaXN0Lml0ZW1zLmxlbmd0aCAtIDE7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhTGlzdC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdzZWxlY3QnLCBkYXRhTGlzdC5pdGVtc1tub2RlSW5kZXhdLmRhdGEpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnZG93bicpIHtcbiAgICAgIGlmIChzZWxlY3RlZEl0ZW0pIHtcbiAgICAgICAgbm9kZUluZGV4ID0gbGFzdEluZGV4ICsgMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGVJbmRleCA9IDA7XG4gICAgICB9XG5cbiAgICAgIGlmICghZGF0YUxpc3QuaGFzTW9yZUl0ZW1zKCkgJiYgbm9kZUluZGV4ID4gZGF0YUxpc3QuaXRlbXMubGVuZ3RoIC0gMSkge1xuICAgICAgICBub2RlSW5kZXggPSAwO1xuICAgICAgfVxuXG4gICAgICBpZiAoKGRhdGFMaXN0Lmhhc01vcmVJdGVtcygpICYmIG5vZGVJbmRleCA+PSBkYXRhTGlzdC5pdGVtcy5sZW5ndGggLSAyKSB8fFxuICAgICAgICAhZGF0YUxpc3QuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRleHQuZW1pdCgnc2VhcmNoJywge1xuICAgICAgICAgIG9mZnNldDogZGF0YUxpc3QuaXRlbXMubGVuZ3RoLFxuICAgICAgICAgIGxpbWl0OiBvcHRpb25zLmxpbWl0LFxuICAgICAgICAgIHNlYXJjaDogaW5pdGlhbFN0YXRlID8gaW5pdGlhbFN0YXRlLnNlYXJjaFRlcm0gOiBlbGVtZW50LnZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGFMaXN0Lml0ZW1zW25vZGVJbmRleF0pIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdzZWxlY3QnLCBkYXRhTGlzdC5pdGVtc1tub2RlSW5kZXhdLmRhdGEpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnZW50ZXInICYmIGlzVmlzaWJsZSgpKSB7XG4gICAgICBzZWxlY3RlZEl0ZW0gPSBzZWxlY3RlZEl0ZW0gfHwgZGF0YUxpc3QuaXRlbXNbMF07XG5cbiAgICAgIGlmIChzZWxlY3RlZEl0ZW0pIHtcbiAgICAgICAgaXNEaXNhYmxlZCA9IG9wdGlvbnMudGVtcGxhdGVzLmlzRGlzYWJsZWQoc2VsZWN0ZWRJdGVtLmRhdGEpO1xuXG4gICAgICAgIGlmICghaXNEaXNhYmxlZCkge1xuICAgICAgICAgIGNvbnRleHQuZW1pdCgnY2hhbmdlJywgc2VsZWN0ZWRJdGVtLmRhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdlc2NhcGUnICYmIGlzVmlzaWJsZSgpKSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ2NhbmNlbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50VmFsdWUgPSBudWxsO1xuICAgIH1cbiAgfSwgdXRpbC5nZXRQYXNzaXZlT3B0aW9uKCkpO1xuXG4gIGNvbnRleHQub24oJ3Njcm9sbGJvdHRvbScsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0LmVtaXQoJ3NlYXJjaCcsIHtcbiAgICAgIG9mZnNldDogZGF0YUxpc3QuaXRlbXMubGVuZ3RoLFxuICAgICAgbGltaXQ6IG9wdGlvbnMubGltaXQsXG4gICAgICBzZWFyY2g6IGluaXRpYWxTdGF0ZS5zZWFyY2hUZXJtLFxuICAgIH0pO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdmb2N1cycsIGZ1bmN0aW9uICgpIHtcbiAgICBjb250ZXh0LmVtaXQoJ29wZW4nKTtcbiAgfSk7XG5cbiAgY29udGV4dC5vbignb3BlbicsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAob3B0aW9ucy5vcGVuT25Gb2N1cykge1xuICAgICAgc2V0VGltZW91dChlbGVtZW50LnNldFNlbGVjdGlvblJhbmdlLmJpbmQoZWxlbWVudCwgMCwgZWxlbWVudC52YWx1ZS5sZW5ndGgpLCAwKTtcblxuICAgICAgaWYgKCFjdXJyZW50VmFsdWUpIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdzZWFyY2gnLCB7IG9mZnNldDogMCwgbGltaXQ6IG9wdGlvbnMubGltaXQsIHNlYXJjaDogZWxlbWVudC52YWx1ZSB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ3Nob3cnLCBmdW5jdGlvbiAoKSB7XG4gICAgZG9tLnJlbW92ZUNsYXNzKGNvbnRhaW5lciwgb3B0aW9ucy5jc3MuaGlkZSk7XG4gICAgY29udGFpbmVyLnN0eWxlLnRvcCA9IChlbGVtZW50Lm9mZnNldFRvcCArIGVsZW1lbnQub2Zmc2V0SGVpZ2h0KSArICdweCc7XG4gICAgY29udGFpbmVyLnN0eWxlLmxlZnQgPSAoZWxlbWVudC5vZmZzZXRMZWZ0KSArICdweCc7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ2Nsb3NlJywgZnVuY3Rpb24gKCkge1xuICAgIGRhdGFMaXN0LmNsZWFuKCk7XG4gICAgZGF0YUxpc3QuaGlkZUxvYWRpbmcoKTtcbiAgICBkb20ucmVtb3ZlQ2xhc3MoZWxlbWVudCwgb3B0aW9ucy5jc3MuaW5wdXRMb2FkaW5nKTtcbiAgICBkb20uYWRkQ2xhc3MoY29udGFpbmVyLCBvcHRpb25zLmNzcy5oaWRlKTtcbiAgICBzZWxlY3RlZEl0ZW0gPSBudWxsO1xuICAgIGxhc3RRdWVyeSA9IG51bGw7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ2NoYW5nZScsIGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgY3VycmVudFZhbHVlID0gaXRlbTtcblxuICAgIGlmIChpdGVtKSB7XG4gICAgICBlbGVtZW50LnZhbHVlID0gcmVuZGVyKG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsLCBpdGVtLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgaW5pdGlhbFN0YXRlID0gbnVsbDtcbiAgICBjb250ZXh0LmVtaXQoJ2Nsb3NlJyk7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ3NlbGVjdCcsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgZG9tLnJlbW92ZUNsYXNzKHNlbGVjdGVkSXRlbS5lbGVtZW50LCBvcHRpb25zLmNzcy5zZWxlY3RlZCk7XG4gICAgfVxuXG4gICAgc2VsZWN0ZWRJdGVtID0gZGF0YUxpc3QuZ2V0QnlEYXRhKGRhdGEpO1xuXG4gICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgZWxlbWVudC52YWx1ZSA9IHJlbmRlcihvcHRpb25zLnRlbXBsYXRlcy5sYWJlbCwgZGF0YSwgZmFsc2UpO1xuICAgICAgZG9tLmFkZENsYXNzKHNlbGVjdGVkSXRlbS5lbGVtZW50LCBvcHRpb25zLmNzcy5zZWxlY3RlZCk7XG4gICAgICB2YXIgdG9wID0gc2VsZWN0ZWRJdGVtLmVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgdmFyIGJvdHRvbSA9IHNlbGVjdGVkSXRlbS5lbGVtZW50Lm9mZnNldFRvcCArIHNlbGVjdGVkSXRlbS5lbGVtZW50Lm9mZnNldEhlaWdodDtcblxuICAgICAgaWYgKGJvdHRvbSA+IGNvbnRhaW5lci5jbGllbnRIZWlnaHQgKyBjb250YWluZXIuc2Nyb2xsVG9wKSB7XG4gICAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AgPSBzZWxlY3RlZEl0ZW0uZWxlbWVudC5vZmZzZXRUb3AgLVxuICAgICAgICAgIGNvbnRhaW5lci5jbGllbnRIZWlnaHQgK1xuICAgICAgICAgIHNlbGVjdGVkSXRlbS5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICAgIH0gZWxzZSBpZiAodG9wIDwgY29udGFpbmVyLnNjcm9sbFRvcCkge1xuICAgICAgICBjb250YWluZXIuc2Nyb2xsVG9wID0gc2VsZWN0ZWRJdGVtLmVsZW1lbnQub2Zmc2V0VG9wO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgY29udGV4dC5vbignY2FuY2VsJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChpbml0aWFsU3RhdGUpIHtcbiAgICAgIGVsZW1lbnQudmFsdWUgPSBpbml0aWFsU3RhdGUuc2VhcmNoVGVybTtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IGluaXRpYWxTdGF0ZS5vbGRWYWx1ZTtcbiAgICAgIGluaXRpYWxTdGF0ZSA9IG51bGw7XG4gICAgfVxuXG4gICAgY29udGV4dC5lbWl0KCdjbG9zZScpO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdzZWFyY2gnLCBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICBpZiAobGFzdFF1ZXJ5ICYmIGxhc3RRdWVyeS5zZWFyY2ggPT09IHF1ZXJ5LnNlYXJjaCAmJiBsYXN0UXVlcnkub2Zmc2V0ID09PSBxdWVyeS5vZmZzZXQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocXVlcnkub2Zmc2V0ID09PSAwKSB7XG4gICAgICBpbml0aWFsU3RhdGUgPSB7IG9sZFZhbHVlOiBjdXJyZW50VmFsdWUsIHNlYXJjaFRlcm06IHF1ZXJ5LnNlYXJjaCB9O1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLnNob3dMb2FkaW5nKSB7XG4gICAgICBkYXRhTGlzdC5zaG93TG9hZGluZyhxdWVyeSk7XG4gICAgICBkb20uYWRkQ2xhc3MoZWxlbWVudCwgb3B0aW9ucy5jc3MuaW5wdXRMb2FkaW5nKTtcbiAgICB9XG5cbiAgICBzaG93TGlzdCgpO1xuXG4gICAgbGFzdFF1ZXJ5ID0gcXVlcnk7XG4gICAgY2FsbGJhY2socXVlcnksIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBjb250ZXh0LmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAobGFzdFF1ZXJ5ID09PSBxdWVyeSkge1xuICAgICAgICBkYXRhTGlzdC5oaWRlTG9hZGluZygpO1xuICAgICAgICBkb20ucmVtb3ZlQ2xhc3MoZWxlbWVudCwgb3B0aW9ucy5jc3MuaW5wdXRMb2FkaW5nKTtcbiAgICAgICAgY29udGV4dC5lbWl0KCdzdWNjZXNzJywgcmVzdWx0LCBxdWVyeSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ3N1Y2Nlc3MnLCBmdW5jdGlvbiAocmVzdWx0LCBxdWVyeSkge1xuICAgIHZhciBpdGVtcyA9IG9wdGlvbnMuZ2V0SXRlbXMocmVzdWx0KTtcblxuICAgIGlmIChxdWVyeS5vZmZzZXQgPT09IDApIHtcbiAgICAgIGRhdGFMaXN0LmNsZWFuKCk7XG4gICAgfVxuXG4gICAgaWYgKGl0ZW1zKSB7XG4gICAgICBzaG93TGlzdCgpO1xuXG4gICAgICBpdGVtcy5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIGRhdGFMaXN0LnB1c2goaXRlbSwgcXVlcnkuc2VhcmNoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAob3B0aW9ucy5oYXNNb3JlSXRlbXMocmVzdWx0KSkge1xuICAgICAgICBkYXRhTGlzdC5zaG93TG9hZE1vcmUocmVzdWx0KTtcbiAgICAgIH0gZWxzZSBpZiAoIWRhdGFMaXN0Lml0ZW1zLmxlbmd0aCkge1xuICAgICAgICBkYXRhTGlzdC5zaG93Tm9SZXN1bHRzKHF1ZXJ5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5lbWl0KCdjbG9zZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGNvbnRleHQ7XG5cbiAgZnVuY3Rpb24gaXNWaXNpYmxlKCkge1xuICAgIHJldHVybiAhZG9tLmhhc0NsYXNzKGNvbnRhaW5lciwgb3B0aW9ucy5jc3MuaGlkZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzaG93TGlzdCgpIHtcbiAgICBpZiAoIWlzVmlzaWJsZSgpKSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ3Nob3cnKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBidWlsZENhbGxiYWNrRnJvbUFycmF5KGFycmF5KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChxdWVyeSwgZG9uZSkge1xuICAgICAgdmFyIHJlc3VsdCA9IGFycmF5XG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICB2YXIgZGVzYyA9IHJlbmRlcihvcHRpb25zLnRlbXBsYXRlcy5sYWJlbCwgaXRlbSwgZmFsc2UpO1xuXG4gICAgICAgICAgcmV0dXJuIHV0aWwucXVlcnlSZWdFeHAocXVlcnkuc2VhcmNoKS50ZXN0KGRlc2MpO1xuICAgICAgICB9KVxuICAgICAgICAuc2xpY2UocXVlcnkub2Zmc2V0LCBxdWVyeS5vZmZzZXQgKyBxdWVyeS5saW1pdCk7XG5cbiAgICAgIGRvbmUobnVsbCwgcmVzdWx0KTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlTW91c2VXaGVlbChlKSB7XG4gICAgdmFyIGJvdHRvbSA9IChjb250YWluZXIuc2Nyb2xsVG9wICsgY29udGFpbmVyLmNsaWVudEhlaWdodCAtIGNvbnRhaW5lci5zY3JvbGxIZWlnaHQpID09PSAwO1xuICAgIHZhciB0b3AgPSBjb250YWluZXIuc2Nyb2xsVG9wID09PSAwO1xuICAgIHZhciBkaXJlY3Rpb24gPSBlLndoZWVsRGVsdGE7XG5cbiAgICBpZiAoKGJvdHRvbSAmJiBkaXJlY3Rpb24gPCAxKSB8fCAodG9wICYmIGRpcmVjdGlvbiA+IDEpKSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAzODogJ3VwJyxcbiAgNDA6ICdkb3duJyxcbiAgMTM6ICdlbnRlcicsXG4gIDI3OiAnZXNjYXBlJyxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbS5qcycpO1xudmFyIHJlbmRlciA9IHJlcXVpcmUoJy4vcmVuZGVyLmpzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlOiBjcmVhdGVMaXN0LFxufTtcblxuZnVuY3Rpb24gY3JlYXRlTGlzdChjb250ZXh0LCBvcHRpb25zKSB7XG4gIHZhciBsb2FkTW9yZTtcbiAgdmFyIGxvYWRpbmc7XG4gIHZhciBsaXN0O1xuICB2YXIgbm9SZXN1bHRzO1xuICB2YXIgaXRlbXMgPSBbXTtcbiAgY29udGV4dC5jb250YWluZXIuaW5uZXJIVE1MID0gJzx1bCcgK1xuICAgIChvcHRpb25zLmNzcy5saXN0ID8gJyBjbGFzcz1cIicgKyBvcHRpb25zLmNzcy5saXN0ICsgJ1wiJyA6ICcnKSArXG4gICAgJz48L3VsPic7XG4gIGxpc3QgPSBjb250ZXh0LmNvbnRhaW5lci5jaGlsZHJlblswXTtcblxuICByZXR1cm4ge1xuICAgIHB1c2g6IHB1c2hJdGVtLFxuICAgIGNsZWFuOiBjbGVhbkl0ZW1zLFxuICAgIGl0ZW1zOiBpdGVtcyxcbiAgICBnZXRCeURhdGE6IGdldEJ5RGF0YSxcbiAgICBzaG93TG9hZGluZzogc2hvd0xvYWRpbmcsXG4gICAgaGlkZUxvYWRpbmc6IGhpZGVMb2FkaW5nLFxuICAgIHNob3dMb2FkTW9yZTogc2hvd0xvYWRNb3JlLFxuICAgIHNob3dOb1Jlc3VsdHM6IHNob3dOb1Jlc3VsdHMsXG4gICAgaGFzTW9yZUl0ZW1zOiBoYXNNb3JlSXRlbXMsXG4gIH07XG5cbiAgZnVuY3Rpb24gcHVzaEl0ZW0oaW5mbywgc2VhcmNoKSB7XG4gICAgdmFyIHJlZ0V4cDtcbiAgICB2YXIgbGFiZWw7XG4gICAgdmFyIGlubmVySFRNTDtcbiAgICB2YXIgbGFzdEluZGV4O1xuICAgIHZhciBtYXRjaGVzO1xuICAgIHZhciBpc0Rpc2FibGVkID0gb3B0aW9ucy50ZW1wbGF0ZXMuaXNEaXNhYmxlZChpbmZvKTtcbiAgICB2YXIgaXRlbUNsYXNzID0gb3B0aW9ucy5jc3MuaXRlbSArIChpc0Rpc2FibGVkID8gJyAnICsgb3B0aW9ucy5jc3MuZGlzYWJsZWQgOiAnJyk7XG4gICAgdmFyIGl0ZW1FbGVtID0gYXBwZW5kRWxlbWVudChvcHRpb25zLnRlbXBsYXRlcy5pdGVtLCBpdGVtQ2xhc3MsIGluZm8pO1xuICAgIHZhciBpdGVtID0geyBkYXRhOiBpbmZvLCBlbGVtZW50OiBpdGVtRWxlbSB9O1xuXG4gICAgaWYgKHNlYXJjaCkge1xuICAgICAgbGFiZWwgPSBvcHRpb25zLnRlbXBsYXRlcy5pdGVtKGluZm8pO1xuICAgICAgcmVnRXhwID0gdXRpbC5xdWVyeVJlZ0V4cChzZWFyY2gpO1xuICAgICAgaW5uZXJIVE1MID0gJyc7XG5cbiAgICAgIHdoaWxlIChtYXRjaGVzID0gcmVnRXhwLmV4ZWMobGFiZWwpKSB7XG4gICAgICAgIGlubmVySFRNTCArPSB1dGlsLmVuY29kZShtYXRjaGVzWzFdKTtcbiAgICAgICAgaW5uZXJIVE1MICs9IGhpZ2hsaWdodChtYXRjaGVzWzJdKTtcbiAgICAgICAgbGFzdEluZGV4ID0gcmVnRXhwLmxhc3RJbmRleDtcbiAgICAgIH1cblxuICAgICAgaWYgKGlubmVySFRNTCkge1xuICAgICAgICBpbm5lckhUTUwgKz0gdXRpbC5lbmNvZGUobGFiZWwuc3Vic3RyKGxhc3RJbmRleCkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5uZXJIVE1MICs9IHV0aWwuZW5jb2RlKGxhYmVsKTtcbiAgICAgIH1cblxuICAgICAgaXRlbUVsZW0uaW5uZXJIVE1MID0gaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIGlmIChvcHRpb25zLmluY2x1ZGVBbmNob3JzKSB7XG4gICAgICBpdGVtRWxlbS5pbm5lckhUTUwgPSAnPGE+JyArIGl0ZW1FbGVtLmlubmVySFRNTCArICc8L2E+JztcbiAgICB9XG5cbiAgICBpdGVtRWxlbS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCFpc0Rpc2FibGVkKSB7XG4gICAgICAgIGNvbnRleHQuZW1pdCgnY2hhbmdlJywgaW5mbyk7XG4gICAgICB9XG4gICAgfSwgdXRpbC5nZXRQYXNzaXZlT3B0aW9uKCkpO1xuXG4gICAgaGlkZUxvYWRpbmcoKTtcbiAgICBsaXN0LmFwcGVuZENoaWxkKGl0ZW1FbGVtKTtcbiAgICBpdGVtcy5wdXNoKGl0ZW0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KHN0cikge1xuICAgIHJldHVybiAnPHNwYW4nICtcbiAgICAgIChvcHRpb25zLmNzcy5tYXRjaCA/ICcgY2xhc3M9XCInICsgb3B0aW9ucy5jc3MubWF0Y2ggKyAnXCInIDogJycpICtcbiAgICAgICc+JyArXG4gICAgICB1dGlsLmVuY29kZShzdHIpICtcbiAgICAgICc8L3NwYW4+JztcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFuSXRlbXMoKSB7XG4gICAgaXRlbXMuc3BsaWNlKDAsIGl0ZW1zLmxlbmd0aCk7XG4gICAgbGlzdC5pbm5lckhUTUwgPSAnJztcbiAgICBsb2FkTW9yZSA9IG51bGw7XG4gICAgbG9hZGluZyA9IG51bGw7XG4gICAgbm9SZXN1bHRzID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEJ5RGF0YShkYXRhKSB7XG4gICAgcmV0dXJuIGl0ZW1zLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkgeyByZXR1cm4gaXRlbS5kYXRhID09PSBkYXRhOyB9KVswXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dMb2FkaW5nKHF1ZXJ5KSB7XG4gICAgaGlkZUxvYWRNb3JlKCk7XG4gICAgaGlkZU5vUmVzdWx0cygpO1xuXG4gICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICBsb2FkaW5nID0gYXBwZW5kRWxlbWVudChvcHRpb25zLnRlbXBsYXRlcy5sb2FkaW5nLCBvcHRpb25zLmNzcy5sb2FkaW5nLCBxdWVyeSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvYWRpbmc7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTG9hZGluZygpIHtcbiAgICBpZiAobG9hZGluZykge1xuICAgICAgbGlzdC5yZW1vdmVDaGlsZChsb2FkaW5nKTtcbiAgICAgIGxvYWRpbmcgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dMb2FkTW9yZShyZXN1bHQpIHtcbiAgICBoaWRlTG9hZGluZygpO1xuXG4gICAgaWYgKCFsb2FkTW9yZSkge1xuICAgICAgbG9hZE1vcmUgPSBhcHBlbmRBbmNob3Iob3B0aW9ucy50ZW1wbGF0ZXMubG9hZE1vcmUsIG9wdGlvbnMuY3NzLmxvYWRNb3JlLCByZXN1bHQpO1xuICAgIH1cblxuICAgIGlmICghb3B0aW9ucy5zaG93TG9hZE1vcmUpIHtcbiAgICAgIGRvbS5hZGRDbGFzcyhsb2FkTW9yZSwgb3B0aW9ucy5jc3MuaGlkZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxvYWRNb3JlO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZUxvYWRNb3JlKCkge1xuICAgIGlmIChsb2FkTW9yZSkge1xuICAgICAgbGlzdC5yZW1vdmVDaGlsZChsb2FkTW9yZSk7XG4gICAgICBsb2FkTW9yZSA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd05vUmVzdWx0cyhyZXN1bHQpIHtcbiAgICBoaWRlTG9hZGluZygpO1xuXG4gICAgaWYgKCFsb2FkTW9yZSkge1xuICAgICAgbm9SZXN1bHRzID0gYXBwZW5kRWxlbWVudChvcHRpb25zLnRlbXBsYXRlcy5ub1Jlc3VsdHMsIG9wdGlvbnMuY3NzLm5vUmVzdWx0cywgcmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTm9SZXN1bHRzKCkge1xuICAgIGlmIChub1Jlc3VsdHMpIHtcbiAgICAgIGxpc3QucmVtb3ZlQ2hpbGQobm9SZXN1bHRzKTtcbiAgICAgIG5vUmVzdWx0cyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaGFzTW9yZUl0ZW1zKCkge1xuICAgIHJldHVybiAhIShsb2FkTW9yZSB8fCBsb2FkaW5nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEVsZW1lbnQodGVtcGxhdGUsIGNsYXNzTmFtZSwgb2JqKSB7XG4gICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIGVsZW1lbnQuaW5uZXJIVE1MID0gcmVuZGVyKHRlbXBsYXRlLCBvYmosIHRydWUpO1xuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lIHx8ICcnO1xuICAgIGxpc3QuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGVuZEFuY2hvcih0ZW1wbGF0ZSwgY2xhc3NOYW1lLCBvYmopIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgdmFyIGFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhbmNob3IuaW5uZXJIVE1MID0gcmVuZGVyKHRlbXBsYXRlLCBvYmosIHRydWUpO1xuICAgIGFuY2hvci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ3Njcm9sbGJvdHRvbScpO1xuICAgIH0sIHV0aWwuZ2V0UGFzc2l2ZU9wdGlvbigpKTtcblxuICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lIHx8ICcnO1xuICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoYW5jaG9yKTtcbiAgICBsaXN0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXI7XG5cbmZ1bmN0aW9uIHJlbmRlcih0ZW1wbGF0ZSwgbW9kZWwsIGVuY29kZSkge1xuICB2YXIgcmVzdWx0O1xuXG4gIGlmICh0eXBlb2YgdGVtcGxhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXN1bHQgPSB0ZW1wbGF0ZShtb2RlbCk7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ID0gdGVtcGxhdGU7XG4gIH1cblxuICBpZiAoZW5jb2RlKSB7XG4gICAgcmVzdWx0ID0gdXRpbC5lbmNvZGUocmVzdWx0KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzdXBwb3J0c1Bhc3NpdmUgPSBmYWxzZTtcblxudHJ5IHtcbiAgdmFyIG9wdHMgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICdwYXNzaXZlJywge1xuICAgIGdldDogZnVuY3Rpb24gZ2V0UGFzc2l2ZVN1cHBvcnQoKSB7XG4gICAgICBzdXBwb3J0c1Bhc3NpdmUgPSB0cnVlO1xuICAgIH0sXG4gIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndGVzdFBhc3NpdmUnLCBudWxsLCBvcHRzKTtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Rlc3RQYXNzaXZlJywgbnVsbCwgb3B0cyk7XG59IGNhdGNoIChlKSB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5jb2RlOiBlbmNvZGUsXG4gIG1lcmdlOiBtZXJnZSxcbiAgcXVlcnlSZWdFeHA6IHF1ZXJ5UmVnRXhwLFxuICBnZXRQYXNzaXZlT3B0aW9uOiBnZXRQYXNzaXZlT3B0aW9uLFxufTtcblxuZnVuY3Rpb24gbWVyZ2Uob2JqMSwgb2JqMikge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIHZhciBhdHRyO1xuXG4gIGZvciAoYXR0ciBpbiBvYmoxKSB7XG4gICAgcmVzdWx0W2F0dHJdID0gb2JqMVthdHRyXTtcbiAgfVxuXG4gIGZvciAoYXR0ciBpbiBvYmoyKSB7XG4gICAgcmVzdWx0W2F0dHJdID0gb2JqMlthdHRyXTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHF1ZXJ5UmVnRXhwKHF1ZXJ5KSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKCcoLio/KSgnICsgZXNjYXBlUmVnRXhwKHF1ZXJ5KSArICcpJywgJ2lnJyk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bLVtcXF17fSgpKis/LixcXFxcXiR8I1xcc10vZywgJ1xcXFwkJicpO1xufVxuXG5mdW5jdGlvbiBlbmNvZGUoc3RyKSB7XG4gIHJldHVybiBzdHJcbiAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAucmVwbGFjZSgvJy9nLCAnJiMwMzk7Jyk7XG59XG5cbmZ1bmN0aW9uIGdldFBhc3NpdmVPcHRpb24oKSB7XG4gIHJldHVybiBzdXBwb3J0c1Bhc3NpdmUgPyB7IHBhc3NpdmU6IHRydWUgfSA6IGZhbHNlO1xufVxuIl19
