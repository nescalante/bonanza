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
  }, { passive: true });

  container.onmousewheel = handleMouseWheel;

  element.addEventListener('focus', function () {
    context.emit('open');
  }, { passive: true });

  element.addEventListener('blur', function (e) {
    if (options.closeOnBlur) {
      context.emit('close');
    }
  }, { passive: true });

  element.addEventListener('keyup', function (e) {
    var key = keys[e.keyCode];

    if (!key) {
      context.emit('search', { offset: 0, limit: options.limit, search: element.value });
    } else if (key !== 'enter') {
      currentValue = null;
    }
  }, { passive: true });

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
  }, { passive: true });

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
    }, { passive: true });

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
    }, { passive: true });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib25hbnphLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJzcmMvZGVmYXVsdHMuanMiLCJzcmMvZG9tLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2tleXMuanMiLCJzcmMvbGlzdC5qcyIsInNyYy9yZW5kZXIuanMiLCJzcmMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9zcmMnKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzcyA9IHtcbiAgY29udGFpbmVyOiAnYnotY29udGFpbmVyJyxcbiAgaGlkZTogJ2J6LWhpZGUnLFxuICBsaXN0OiAnYnotbGlzdCcsXG4gIGl0ZW06ICdiei1saXN0LWl0ZW0nLFxuICBkaXNhYmxlZDogJ2J6LWxpc3QtaXRlbS1kaXNhYmxlZCcsXG4gIHNlbGVjdGVkOiAnYnotbGlzdC1pdGVtLXNlbGVjdGVkJyxcbiAgbG9hZGluZzogJ2J6LWxpc3QtbG9hZGluZycsXG4gIGxvYWRNb3JlOiAnYnotbGlzdC1sb2FkLW1vcmUnLFxuICBub1Jlc3VsdHM6ICdiei1saXN0LW5vLXJlc3VsdHMnLFxuICBpbnB1dExvYWRpbmc6ICdiei1sb2FkaW5nJyxcbiAgbWF0Y2g6ICdiei10ZXh0LW1hdGNoJyxcbn07XG5cbnZhciB0ZW1wbGF0ZXMgPSB7XG4gIGl0ZW06IGZ1bmN0aW9uIChpdGVtKSB7IHJldHVybiBpdGVtOyB9LFxuXG4gIGxhYmVsOiBmdW5jdGlvbiAobGFiZWwpIHsgcmV0dXJuIGxhYmVsOyB9LFxuXG4gIGlzRGlzYWJsZWQ6IGZ1bmN0aW9uIChpdGVtKSB7IHJldHVybiBmYWxzZTsgfSxcblxuICBub1Jlc3VsdHM6IGZ1bmN0aW9uIChvYmopIHtcbiAgICByZXR1cm4gJ05vIHJlc3VsdHMnICsgKG9iaiAmJiBvYmouc2VhcmNoID8gJyBmb3IgXCInICsgb2JqLnNlYXJjaCArICdcIicgOiAnJyk7XG4gIH0sXG5cbiAgbG9hZE1vcmU6ICcuLi4nLFxuICBsb2FkaW5nOiAnTG9hZGluZyAuLi4nLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHRlbXBsYXRlczogdGVtcGxhdGVzLFxuICBjc3M6IGNzcyxcbiAgb3Blbk9uRm9jdXM6IHRydWUsXG4gIGNsb3NlT25CbHVyOiB0cnVlLFxuICBzaG93TG9hZGluZzogdHJ1ZSxcbiAgc2hvd2xvYWRNb3JlOiB0cnVlLFxuICBpbmNsdWRlQW5jaG9yczogZmFsc2UsXG4gIGxpbWl0OiAxMCxcbiAgc2Nyb2xsRGlzdGFuY2U6IDAsXG4gIGhhc01vcmVJdGVtczogZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gISFyZXN1bHQubGVuZ3RoICYmIHJlc3VsdC5sZW5ndGggPT09IHRoaXMubGltaXQ7IH0sXG5cbiAgZ2V0SXRlbXM6IGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuIHJlc3VsdDsgfSxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxufTtcblxuZnVuY3Rpb24gYWRkQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gIGlmICghY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKCFoYXNDbGFzcyhlbGVtZW50LCBjbGFzc05hbWUpKSB7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSAoZWxlbWVudC5jbGFzc05hbWUgKyAoZWxlbWVudC5jbGFzc05hbWUgPyAnICcgOiAnJykgKyBjbGFzc05hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICBpZiAoIWNsYXNzTmFtZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjbGFzc1JlZ2V4ID0gbmV3IFJlZ0V4cCgnXFxcXGInICsgY2xhc3NOYW1lICsgJ1xcXFxiJywgJ2cnKTtcbiAgZWxlbWVudC5jbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZS5yZXBsYWNlKGNsYXNzUmVnZXgsICcnKS5yZXBsYWNlKC8gIC9nLCAnICcpLnRyaW0oKTtcbn1cblxuZnVuY3Rpb24gaGFzQ2xhc3MoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG4gIHZhciBjbGFzc2VzID0gZWxlbWVudC5jbGFzc05hbWUuc3BsaXQoJyAnKTtcblxuICByZXR1cm4gY2xhc3Nlcy5pbmRleE9mKGNsYXNzTmFtZSkgIT09IC0xO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4vZG9tLmpzJyk7XG52YXIgZGVmYXVsdHMgPSByZXF1aXJlKCcuL2RlZmF1bHRzLmpzJyk7XG52YXIga2V5cyA9IHJlcXVpcmUoJy4va2V5cy5qcycpO1xudmFyIGxpc3QgPSByZXF1aXJlKCcuL2xpc3QuanMnKTtcbnZhciByZW5kZXIgPSByZXF1aXJlKCcuL3JlbmRlci5qcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxuYm9uYW56YS5kZWZhdWx0cyA9IGRlZmF1bHRzO1xuZ2xvYmFsLmJvbmFuemEgPSBib25hbnphO1xubW9kdWxlLmV4cG9ydHMgPSBib25hbnphO1xuXG5mdW5jdGlvbiBib25hbnphKGVsZW1lbnQsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIGlmICghZWxlbWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcignQW4gZWxlbWVudCBpcyByZXF1aXJlZCB0byBpbml0aWFsaXplIGJvbmFuemEnKTtcbiAgfVxuXG4gIGlmICghY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG5cbiAgaWYgKCFjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcignQSBzb3VyY2UgaXMgcmVxdWlyZWQgdG8gaW5pdGlhbGl6ZSBib25hbnphJyk7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShjYWxsYmFjaykpIHtcbiAgICBjYWxsYmFjayA9IGJ1aWxkQ2FsbGJhY2tGcm9tQXJyYXkoY2FsbGJhY2spO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMudGVtcGxhdGVzKSB7XG4gICAgaWYgKG9wdGlvbnMudGVtcGxhdGVzLml0ZW0gJiYgb3B0aW9ucy50ZW1wbGF0ZXMubGFiZWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgb3B0aW9ucy50ZW1wbGF0ZXMubGFiZWwgPSBvcHRpb25zLnRlbXBsYXRlcy5pdGVtO1xuICAgIH1cblxuICAgIG9wdGlvbnMudGVtcGxhdGVzID0gdXRpbC5tZXJnZShkZWZhdWx0cy50ZW1wbGF0ZXMsIG9wdGlvbnMudGVtcGxhdGVzKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNzcykge1xuICAgIG9wdGlvbnMuY3NzID0gdXRpbC5tZXJnZShkZWZhdWx0cy5jc3MsIG9wdGlvbnMuY3NzKTtcbiAgfVxuXG4gIG9wdGlvbnMgPSB1dGlsLm1lcmdlKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICB2YXIgY29udGV4dCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgdmFyIHNlbGVjdGVkSXRlbTtcbiAgdmFyIGxhc3RRdWVyeTtcbiAgdmFyIGluaXRpYWxTdGF0ZTtcbiAgdmFyIGN1cnJlbnRWYWx1ZTtcblxuICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIGNvbnRhaW5lci5jbGFzc05hbWUgPSBvcHRpb25zLmNzcy5jb250YWluZXIgfHwgJyc7XG4gIGVsZW1lbnQucGFyZW50Tm9kZS5hcHBlbmRDaGlsZChjb250YWluZXIpO1xuICBkb20uYWRkQ2xhc3MoY29udGFpbmVyLCBvcHRpb25zLmNzcy5oaWRlKTtcblxuICBjb250ZXh0LmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgY29udGV4dC5pbnB1dCA9IGVsZW1lbnQ7XG4gIGNvbnRleHQub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgdmFyIGRhdGFMaXN0ID0gbGlzdC5jcmVhdGUoY29udGV4dCwgb3B0aW9ucyk7XG5cbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGJvdHRvbSA9IGUudGFyZ2V0LnNjcm9sbFRvcCArIGUudGFyZ2V0LmNsaWVudEhlaWdodCAtIGUudGFyZ2V0LnNjcm9sbEhlaWdodDtcblxuICAgIGlmIChib3R0b20gPj0gKC0xICogb3B0aW9ucy5zY3JvbGxEaXN0YW5jZSkgJiYgZGF0YUxpc3QuaGFzTW9yZUl0ZW1zKCkgJiYgaW5pdGlhbFN0YXRlKSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ3Njcm9sbGJvdHRvbScpO1xuICAgIH1cbiAgfSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuXG4gIGNvbnRhaW5lci5vbm1vdXNld2hlZWwgPSBoYW5kbGVNb3VzZVdoZWVsO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29udGV4dC5lbWl0KCdvcGVuJyk7XG4gIH0sIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcblxuICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChvcHRpb25zLmNsb3NlT25CbHVyKSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ2Nsb3NlJyk7XG4gICAgfVxuICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XG5cbiAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGtleSA9IGtleXNbZS5rZXlDb2RlXTtcblxuICAgIGlmICgha2V5KSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ3NlYXJjaCcsIHsgb2Zmc2V0OiAwLCBsaW1pdDogb3B0aW9ucy5saW1pdCwgc2VhcmNoOiBlbGVtZW50LnZhbHVlIH0pO1xuICAgIH0gZWxzZSBpZiAoa2V5ICE9PSAnZW50ZXInKSB7XG4gICAgICBjdXJyZW50VmFsdWUgPSBudWxsO1xuICAgIH1cbiAgfSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuXG4gIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIGxhc3RJbmRleDtcbiAgICB2YXIgbm9kZUluZGV4O1xuICAgIHZhciBpc0Rpc2FibGVkO1xuICAgIHZhciBrZXkgPSBrZXlzW2Uua2V5Q29kZV07XG5cbiAgICBpZiAoc2VsZWN0ZWRJdGVtKSB7XG4gICAgICBsYXN0SW5kZXggPSBkYXRhTGlzdC5pdGVtcy5pbmRleE9mKHNlbGVjdGVkSXRlbSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxhc3RJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgaWYgKGtleSA9PT0gJ3VwJykge1xuICAgICAgbm9kZUluZGV4ID0gKGxhc3RJbmRleCB8fCAwKSAtIDE7XG5cbiAgICAgIGlmIChub2RlSW5kZXggPT09IC0xICYmIGRhdGFMaXN0Lmhhc01vcmVJdGVtcygpKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IDA7XG4gICAgICB9IGVsc2UgaWYgKG5vZGVJbmRleCA8IDApIHtcbiAgICAgICAgbm9kZUluZGV4ID0gZGF0YUxpc3QuaXRlbXMubGVuZ3RoIC0gMTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGFMaXN0Lml0ZW1zLmxlbmd0aCkge1xuICAgICAgICBjb250ZXh0LmVtaXQoJ3NlbGVjdCcsIGRhdGFMaXN0Lml0ZW1zW25vZGVJbmRleF0uZGF0YSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdkb3duJykge1xuICAgICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgICBub2RlSW5kZXggPSBsYXN0SW5kZXggKyAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZUluZGV4ID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKCFkYXRhTGlzdC5oYXNNb3JlSXRlbXMoKSAmJiBub2RlSW5kZXggPiBkYXRhTGlzdC5pdGVtcy5sZW5ndGggLSAxKSB7XG4gICAgICAgIG5vZGVJbmRleCA9IDA7XG4gICAgICB9XG5cbiAgICAgIGlmICgoZGF0YUxpc3QuaGFzTW9yZUl0ZW1zKCkgJiYgbm9kZUluZGV4ID49IGRhdGFMaXN0Lml0ZW1zLmxlbmd0aCAtIDIpIHx8XG4gICAgICAgICFkYXRhTGlzdC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdzZWFyY2gnLCB7XG4gICAgICAgICAgb2Zmc2V0OiBkYXRhTGlzdC5pdGVtcy5sZW5ndGgsXG4gICAgICAgICAgbGltaXQ6IG9wdGlvbnMubGltaXQsXG4gICAgICAgICAgc2VhcmNoOiBpbml0aWFsU3RhdGUgPyBpbml0aWFsU3RhdGUuc2VhcmNoVGVybSA6IGVsZW1lbnQudmFsdWUsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGF0YUxpc3QuaXRlbXNbbm9kZUluZGV4XSkge1xuICAgICAgICBjb250ZXh0LmVtaXQoJ3NlbGVjdCcsIGRhdGFMaXN0Lml0ZW1zW25vZGVJbmRleF0uZGF0YSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdlbnRlcicgJiYgaXNWaXNpYmxlKCkpIHtcbiAgICAgIHNlbGVjdGVkSXRlbSA9IHNlbGVjdGVkSXRlbSB8fCBkYXRhTGlzdC5pdGVtc1swXTtcblxuICAgICAgaWYgKHNlbGVjdGVkSXRlbSkge1xuICAgICAgICBpc0Rpc2FibGVkID0gb3B0aW9ucy50ZW1wbGF0ZXMuaXNEaXNhYmxlZChzZWxlY3RlZEl0ZW0uZGF0YSk7XG5cbiAgICAgICAgaWYgKCFpc0Rpc2FibGVkKSB7XG4gICAgICAgICAgY29udGV4dC5lbWl0KCdjaGFuZ2UnLCBzZWxlY3RlZEl0ZW0uZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ2VzY2FwZScgJiYgaXNWaXNpYmxlKCkpIHtcbiAgICAgIGNvbnRleHQuZW1pdCgnY2FuY2VsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnRWYWx1ZSA9IG51bGw7XG4gICAgfVxuICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XG5cbiAgY29udGV4dC5vbignc2Nyb2xsYm90dG9tJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQuZW1pdCgnc2VhcmNoJywge1xuICAgICAgb2Zmc2V0OiBkYXRhTGlzdC5pdGVtcy5sZW5ndGgsXG4gICAgICBsaW1pdDogb3B0aW9ucy5saW1pdCxcbiAgICAgIHNlYXJjaDogaW5pdGlhbFN0YXRlLnNlYXJjaFRlcm0sXG4gICAgfSk7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ2ZvY3VzJywgZnVuY3Rpb24gKCkge1xuICAgIGNvbnRleHQuZW1pdCgnb3BlbicpO1xuICB9KTtcblxuICBjb250ZXh0Lm9uKCdvcGVuJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChvcHRpb25zLm9wZW5PbkZvY3VzKSB7XG4gICAgICBzZXRUaW1lb3V0KGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UuYmluZChlbGVtZW50LCAwLCBlbGVtZW50LnZhbHVlLmxlbmd0aCksIDApO1xuXG4gICAgICBpZiAoIWN1cnJlbnRWYWx1ZSkge1xuICAgICAgICBjb250ZXh0LmVtaXQoJ3NlYXJjaCcsIHsgb2Zmc2V0OiAwLCBsaW1pdDogb3B0aW9ucy5saW1pdCwgc2VhcmNoOiBlbGVtZW50LnZhbHVlIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgY29udGV4dC5vbignc2hvdycsIGZ1bmN0aW9uICgpIHtcbiAgICBkb20ucmVtb3ZlQ2xhc3MoY29udGFpbmVyLCBvcHRpb25zLmNzcy5oaWRlKTtcbiAgICBjb250YWluZXIuc3R5bGUudG9wID0gKGVsZW1lbnQub2Zmc2V0VG9wICsgZWxlbWVudC5vZmZzZXRIZWlnaHQpICsgJ3B4JztcbiAgICBjb250YWluZXIuc3R5bGUubGVmdCA9IChlbGVtZW50Lm9mZnNldExlZnQpICsgJ3B4JztcbiAgfSk7XG5cbiAgY29udGV4dC5vbignY2xvc2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgZGF0YUxpc3QuY2xlYW4oKTtcbiAgICBkYXRhTGlzdC5oaWRlTG9hZGluZygpO1xuICAgIGRvbS5yZW1vdmVDbGFzcyhlbGVtZW50LCBvcHRpb25zLmNzcy5pbnB1dExvYWRpbmcpO1xuICAgIGRvbS5hZGRDbGFzcyhjb250YWluZXIsIG9wdGlvbnMuY3NzLmhpZGUpO1xuICAgIHNlbGVjdGVkSXRlbSA9IG51bGw7XG4gICAgbGFzdFF1ZXJ5ID0gbnVsbDtcbiAgfSk7XG5cbiAgY29udGV4dC5vbignY2hhbmdlJywgZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICBjdXJyZW50VmFsdWUgPSBpdGVtO1xuXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGVsZW1lbnQudmFsdWUgPSByZW5kZXIob3B0aW9ucy50ZW1wbGF0ZXMubGFiZWwsIGl0ZW0sIGZhbHNlKTtcbiAgICB9XG5cbiAgICBpbml0aWFsU3RhdGUgPSBudWxsO1xuICAgIGNvbnRleHQuZW1pdCgnY2xvc2UnKTtcbiAgfSk7XG5cbiAgY29udGV4dC5vbignc2VsZWN0JywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZiAoc2VsZWN0ZWRJdGVtKSB7XG4gICAgICBkb20ucmVtb3ZlQ2xhc3Moc2VsZWN0ZWRJdGVtLmVsZW1lbnQsIG9wdGlvbnMuY3NzLnNlbGVjdGVkKTtcbiAgICB9XG5cbiAgICBzZWxlY3RlZEl0ZW0gPSBkYXRhTGlzdC5nZXRCeURhdGEoZGF0YSk7XG5cbiAgICBpZiAoc2VsZWN0ZWRJdGVtKSB7XG4gICAgICBlbGVtZW50LnZhbHVlID0gcmVuZGVyKG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsLCBkYXRhLCBmYWxzZSk7XG4gICAgICBkb20uYWRkQ2xhc3Moc2VsZWN0ZWRJdGVtLmVsZW1lbnQsIG9wdGlvbnMuY3NzLnNlbGVjdGVkKTtcbiAgICAgIHZhciB0b3AgPSBzZWxlY3RlZEl0ZW0uZWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICB2YXIgYm90dG9tID0gc2VsZWN0ZWRJdGVtLmVsZW1lbnQub2Zmc2V0VG9wICsgc2VsZWN0ZWRJdGVtLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuXG4gICAgICBpZiAoYm90dG9tID4gY29udGFpbmVyLmNsaWVudEhlaWdodCArIGNvbnRhaW5lci5zY3JvbGxUb3ApIHtcbiAgICAgICAgY29udGFpbmVyLnNjcm9sbFRvcCA9IHNlbGVjdGVkSXRlbS5lbGVtZW50Lm9mZnNldFRvcCAtXG4gICAgICAgICAgY29udGFpbmVyLmNsaWVudEhlaWdodCArXG4gICAgICAgICAgc2VsZWN0ZWRJdGVtLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgICAgfSBlbHNlIGlmICh0b3AgPCBjb250YWluZXIuc2Nyb2xsVG9wKSB7XG4gICAgICAgIGNvbnRhaW5lci5zY3JvbGxUb3AgPSBzZWxlY3RlZEl0ZW0uZWxlbWVudC5vZmZzZXRUb3A7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBjb250ZXh0Lm9uKCdjYW5jZWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGluaXRpYWxTdGF0ZSkge1xuICAgICAgZWxlbWVudC52YWx1ZSA9IGluaXRpYWxTdGF0ZS5zZWFyY2hUZXJtO1xuICAgICAgY3VycmVudFZhbHVlID0gaW5pdGlhbFN0YXRlLm9sZFZhbHVlO1xuICAgICAgaW5pdGlhbFN0YXRlID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb250ZXh0LmVtaXQoJ2Nsb3NlJyk7XG4gIH0pO1xuXG4gIGNvbnRleHQub24oJ3NlYXJjaCcsIGZ1bmN0aW9uIChxdWVyeSkge1xuICAgIGlmIChsYXN0UXVlcnkgJiYgbGFzdFF1ZXJ5LnNlYXJjaCA9PT0gcXVlcnkuc2VhcmNoICYmIGxhc3RRdWVyeS5vZmZzZXQgPT09IHF1ZXJ5Lm9mZnNldCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChxdWVyeS5vZmZzZXQgPT09IDApIHtcbiAgICAgIGluaXRpYWxTdGF0ZSA9IHsgb2xkVmFsdWU6IGN1cnJlbnRWYWx1ZSwgc2VhcmNoVGVybTogcXVlcnkuc2VhcmNoIH07XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuc2hvd0xvYWRpbmcpIHtcbiAgICAgIGRhdGFMaXN0LnNob3dMb2FkaW5nKHF1ZXJ5KTtcbiAgICAgIGRvbS5hZGRDbGFzcyhlbGVtZW50LCBvcHRpb25zLmNzcy5pbnB1dExvYWRpbmcpO1xuICAgIH1cblxuICAgIHNob3dMaXN0KCk7XG5cbiAgICBsYXN0UXVlcnkgPSBxdWVyeTtcbiAgICBjYWxsYmFjayhxdWVyeSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGNvbnRleHQuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChsYXN0UXVlcnkgPT09IHF1ZXJ5KSB7XG4gICAgICAgIGRhdGFMaXN0LmhpZGVMb2FkaW5nKCk7XG4gICAgICAgIGRvbS5yZW1vdmVDbGFzcyhlbGVtZW50LCBvcHRpb25zLmNzcy5pbnB1dExvYWRpbmcpO1xuICAgICAgICBjb250ZXh0LmVtaXQoJ3N1Y2Nlc3MnLCByZXN1bHQsIHF1ZXJ5KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgY29udGV4dC5vbignc3VjY2VzcycsIGZ1bmN0aW9uIChyZXN1bHQsIHF1ZXJ5KSB7XG4gICAgdmFyIGl0ZW1zID0gb3B0aW9ucy5nZXRJdGVtcyhyZXN1bHQpO1xuXG4gICAgaWYgKHF1ZXJ5Lm9mZnNldCA9PT0gMCkge1xuICAgICAgZGF0YUxpc3QuY2xlYW4oKTtcbiAgICB9XG5cbiAgICBpZiAoaXRlbXMpIHtcbiAgICAgIHNob3dMaXN0KCk7XG5cbiAgICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgZGF0YUxpc3QucHVzaChpdGVtLCBxdWVyeS5zZWFyY2gpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChvcHRpb25zLmhhc01vcmVJdGVtcyhyZXN1bHQpKSB7XG4gICAgICAgIGRhdGFMaXN0LnNob3dMb2FkTW9yZShyZXN1bHQpO1xuICAgICAgfSBlbHNlIGlmICghZGF0YUxpc3QuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgIGRhdGFMaXN0LnNob3dOb1Jlc3VsdHMocXVlcnkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmVtaXQoJ2Nsb3NlJyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gY29udGV4dDtcblxuICBmdW5jdGlvbiBpc1Zpc2libGUoKSB7XG4gICAgcmV0dXJuICFkb20uaGFzQ2xhc3MoY29udGFpbmVyLCBvcHRpb25zLmNzcy5oaWRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3dMaXN0KCkge1xuICAgIGlmICghaXNWaXNpYmxlKCkpIHtcbiAgICAgIGNvbnRleHQuZW1pdCgnc2hvdycpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkQ2FsbGJhY2tGcm9tQXJyYXkoYXJyYXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHF1ZXJ5LCBkb25lKSB7XG4gICAgICB2YXIgcmVzdWx0ID0gYXJyYXlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHZhciBkZXNjID0gcmVuZGVyKG9wdGlvbnMudGVtcGxhdGVzLmxhYmVsLCBpdGVtLCBmYWxzZSk7XG5cbiAgICAgICAgICByZXR1cm4gdXRpbC5xdWVyeVJlZ0V4cChxdWVyeS5zZWFyY2gpLnRlc3QoZGVzYyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zbGljZShxdWVyeS5vZmZzZXQsIHF1ZXJ5Lm9mZnNldCArIHF1ZXJ5LmxpbWl0KTtcblxuICAgICAgZG9uZShudWxsLCByZXN1bHQpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVNb3VzZVdoZWVsKGUpIHtcbiAgICB2YXIgYm90dG9tID0gKGNvbnRhaW5lci5zY3JvbGxUb3AgKyBjb250YWluZXIuY2xpZW50SGVpZ2h0IC0gY29udGFpbmVyLnNjcm9sbEhlaWdodCkgPT09IDA7XG4gICAgdmFyIHRvcCA9IGNvbnRhaW5lci5zY3JvbGxUb3AgPT09IDA7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGUud2hlZWxEZWx0YTtcblxuICAgIGlmICgoYm90dG9tICYmIGRpcmVjdGlvbiA8IDEpIHx8ICh0b3AgJiYgZGlyZWN0aW9uID4gMSkpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIDM4OiAndXAnLFxuICA0MDogJ2Rvd24nLFxuICAxMzogJ2VudGVyJyxcbiAgMjc6ICdlc2NhcGUnLFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRvbSA9IHJlcXVpcmUoJy4vZG9tLmpzJyk7XG52YXIgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXIuanMnKTtcbnZhciB1dGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZUxpc3QsXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVMaXN0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgdmFyIGxvYWRNb3JlO1xuICB2YXIgbG9hZGluZztcbiAgdmFyIGxpc3Q7XG4gIHZhciBub1Jlc3VsdHM7XG4gIHZhciBpdGVtcyA9IFtdO1xuICBjb250ZXh0LmNvbnRhaW5lci5pbm5lckhUTUwgPSAnPHVsJyArXG4gICAgKG9wdGlvbnMuY3NzLmxpc3QgPyAnIGNsYXNzPVwiJyArIG9wdGlvbnMuY3NzLmxpc3QgKyAnXCInIDogJycpICtcbiAgICAnPjwvdWw+JztcbiAgbGlzdCA9IGNvbnRleHQuY29udGFpbmVyLmNoaWxkcmVuWzBdO1xuXG4gIHJldHVybiB7XG4gICAgcHVzaDogcHVzaEl0ZW0sXG4gICAgY2xlYW46IGNsZWFuSXRlbXMsXG4gICAgaXRlbXM6IGl0ZW1zLFxuICAgIGdldEJ5RGF0YTogZ2V0QnlEYXRhLFxuICAgIHNob3dMb2FkaW5nOiBzaG93TG9hZGluZyxcbiAgICBoaWRlTG9hZGluZzogaGlkZUxvYWRpbmcsXG4gICAgc2hvd0xvYWRNb3JlOiBzaG93TG9hZE1vcmUsXG4gICAgc2hvd05vUmVzdWx0czogc2hvd05vUmVzdWx0cyxcbiAgICBoYXNNb3JlSXRlbXM6IGhhc01vcmVJdGVtcyxcbiAgfTtcblxuICBmdW5jdGlvbiBwdXNoSXRlbShpbmZvLCBzZWFyY2gpIHtcbiAgICB2YXIgcmVnRXhwO1xuICAgIHZhciBsYWJlbDtcbiAgICB2YXIgaW5uZXJIVE1MO1xuICAgIHZhciBsYXN0SW5kZXg7XG4gICAgdmFyIG1hdGNoZXM7XG4gICAgdmFyIGlzRGlzYWJsZWQgPSBvcHRpb25zLnRlbXBsYXRlcy5pc0Rpc2FibGVkKGluZm8pO1xuICAgIHZhciBpdGVtQ2xhc3MgPSBvcHRpb25zLmNzcy5pdGVtICsgKGlzRGlzYWJsZWQgPyAnICcgKyBvcHRpb25zLmNzcy5kaXNhYmxlZCA6ICcnKTtcbiAgICB2YXIgaXRlbUVsZW0gPSBhcHBlbmRFbGVtZW50KG9wdGlvbnMudGVtcGxhdGVzLml0ZW0sIGl0ZW1DbGFzcywgaW5mbyk7XG4gICAgdmFyIGl0ZW0gPSB7IGRhdGE6IGluZm8sIGVsZW1lbnQ6IGl0ZW1FbGVtIH07XG5cbiAgICBpZiAoc2VhcmNoKSB7XG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGVtcGxhdGVzLml0ZW0oaW5mbyk7XG4gICAgICByZWdFeHAgPSB1dGlsLnF1ZXJ5UmVnRXhwKHNlYXJjaCk7XG4gICAgICBpbm5lckhUTUwgPSAnJztcblxuICAgICAgd2hpbGUgKG1hdGNoZXMgPSByZWdFeHAuZXhlYyhsYWJlbCkpIHtcbiAgICAgICAgaW5uZXJIVE1MICs9IHV0aWwuZW5jb2RlKG1hdGNoZXNbMV0pO1xuICAgICAgICBpbm5lckhUTUwgKz0gaGlnaGxpZ2h0KG1hdGNoZXNbMl0pO1xuICAgICAgICBsYXN0SW5kZXggPSByZWdFeHAubGFzdEluZGV4O1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5uZXJIVE1MKSB7XG4gICAgICAgIGlubmVySFRNTCArPSB1dGlsLmVuY29kZShsYWJlbC5zdWJzdHIobGFzdEluZGV4KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbm5lckhUTUwgKz0gdXRpbC5lbmNvZGUobGFiZWwpO1xuICAgICAgfVxuXG4gICAgICBpdGVtRWxlbS5pbm5lckhUTUwgPSBpbm5lckhUTUw7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuaW5jbHVkZUFuY2hvcnMpIHtcbiAgICAgIGl0ZW1FbGVtLmlubmVySFRNTCA9ICc8YT4nICsgaXRlbUVsZW0uaW5uZXJIVE1MICsgJzwvYT4nO1xuICAgIH1cblxuICAgIGl0ZW1FbGVtLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBpZiAoIWlzRGlzYWJsZWQpIHtcbiAgICAgICAgY29udGV4dC5lbWl0KCdjaGFuZ2UnLCBpbmZvKTtcbiAgICAgIH1cbiAgICB9LCB7IHBhc3NpdmU6IHRydWUgfSk7XG5cbiAgICBoaWRlTG9hZGluZygpO1xuICAgIGxpc3QuYXBwZW5kQ2hpbGQoaXRlbUVsZW0pO1xuICAgIGl0ZW1zLnB1c2goaXRlbSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWdobGlnaHQoc3RyKSB7XG4gICAgcmV0dXJuICc8c3BhbicgK1xuICAgICAgKG9wdGlvbnMuY3NzLm1hdGNoID8gJyBjbGFzcz1cIicgKyBvcHRpb25zLmNzcy5tYXRjaCArICdcIicgOiAnJykgK1xuICAgICAgJz4nICtcbiAgICAgIHV0aWwuZW5jb2RlKHN0cikgK1xuICAgICAgJzwvc3Bhbj4nO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYW5JdGVtcygpIHtcbiAgICBpdGVtcy5zcGxpY2UoMCwgaXRlbXMubGVuZ3RoKTtcbiAgICBsaXN0LmlubmVySFRNTCA9ICcnO1xuICAgIGxvYWRNb3JlID0gbnVsbDtcbiAgICBsb2FkaW5nID0gbnVsbDtcbiAgICBub1Jlc3VsdHMgPSBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0QnlEYXRhKGRhdGEpIHtcbiAgICByZXR1cm4gaXRlbXMuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7IHJldHVybiBpdGVtLmRhdGEgPT09IGRhdGE7IH0pWzBdO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0xvYWRpbmcocXVlcnkpIHtcbiAgICBoaWRlTG9hZE1vcmUoKTtcbiAgICBoaWRlTm9SZXN1bHRzKCk7XG5cbiAgICBpZiAoIWxvYWRpbmcpIHtcbiAgICAgIGxvYWRpbmcgPSBhcHBlbmRFbGVtZW50KG9wdGlvbnMudGVtcGxhdGVzLmxvYWRpbmcsIG9wdGlvbnMuY3NzLmxvYWRpbmcsIHF1ZXJ5KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbG9hZGluZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVMb2FkaW5nKCkge1xuICAgIGlmIChsb2FkaW5nKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxvYWRpbmcpO1xuICAgICAgbG9hZGluZyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2hvd0xvYWRNb3JlKHJlc3VsdCkge1xuICAgIGhpZGVMb2FkaW5nKCk7XG5cbiAgICBpZiAoIWxvYWRNb3JlKSB7XG4gICAgICBsb2FkTW9yZSA9IGFwcGVuZEFuY2hvcihvcHRpb25zLnRlbXBsYXRlcy5sb2FkTW9yZSwgb3B0aW9ucy5jc3MubG9hZE1vcmUsIHJlc3VsdCk7XG4gICAgfVxuXG4gICAgaWYgKCFvcHRpb25zLnNob3dMb2FkTW9yZSkge1xuICAgICAgZG9tLmFkZENsYXNzKGxvYWRNb3JlLCBvcHRpb25zLmNzcy5oaWRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbG9hZE1vcmU7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlTG9hZE1vcmUoKSB7XG4gICAgaWYgKGxvYWRNb3JlKSB7XG4gICAgICBsaXN0LnJlbW92ZUNoaWxkKGxvYWRNb3JlKTtcbiAgICAgIGxvYWRNb3JlID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93Tm9SZXN1bHRzKHJlc3VsdCkge1xuICAgIGhpZGVMb2FkaW5nKCk7XG5cbiAgICBpZiAoIWxvYWRNb3JlKSB7XG4gICAgICBub1Jlc3VsdHMgPSBhcHBlbmRFbGVtZW50KG9wdGlvbnMudGVtcGxhdGVzLm5vUmVzdWx0cywgb3B0aW9ucy5jc3Mubm9SZXN1bHRzLCByZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhpZGVOb1Jlc3VsdHMoKSB7XG4gICAgaWYgKG5vUmVzdWx0cykge1xuICAgICAgbGlzdC5yZW1vdmVDaGlsZChub1Jlc3VsdHMpO1xuICAgICAgbm9SZXN1bHRzID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBoYXNNb3JlSXRlbXMoKSB7XG4gICAgcmV0dXJuICEhKGxvYWRNb3JlIHx8IGxvYWRpbmcpO1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kRWxlbWVudCh0ZW1wbGF0ZSwgY2xhc3NOYW1lLCBvYmopIHtcbiAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgZWxlbWVudC5pbm5lckhUTUwgPSByZW5kZXIodGVtcGxhdGUsIG9iaiwgdHJ1ZSk7XG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWUgfHwgJyc7XG4gICAgbGlzdC5hcHBlbmRDaGlsZChlbGVtZW50KTtcblxuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwZW5kQW5jaG9yKHRlbXBsYXRlLCBjbGFzc05hbWUsIG9iaikge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICB2YXIgYW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGFuY2hvci5pbm5lckhUTUwgPSByZW5kZXIodGVtcGxhdGUsIG9iaiwgdHJ1ZSk7XG4gICAgYW5jaG9yLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnRleHQuZW1pdCgnc2Nyb2xsYm90dG9tJyk7XG4gICAgfSwgeyBwYXNzaXZlOiB0cnVlIH0pO1xuXG4gICAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWUgfHwgJyc7XG4gICAgZWxlbWVudC5hcHBlbmRDaGlsZChhbmNob3IpO1xuICAgIGxpc3QuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlcjtcblxuZnVuY3Rpb24gcmVuZGVyKHRlbXBsYXRlLCBtb2RlbCwgZW5jb2RlKSB7XG4gIHZhciByZXN1bHQ7XG5cbiAgaWYgKHR5cGVvZiB0ZW1wbGF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJlc3VsdCA9IHRlbXBsYXRlKG1vZGVsKTtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgPSB0ZW1wbGF0ZTtcbiAgfVxuXG4gIGlmIChlbmNvZGUpIHtcbiAgICByZXN1bHQgPSB1dGlsLmVuY29kZShyZXN1bHQpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVuY29kZTogZW5jb2RlLFxuICBtZXJnZTogbWVyZ2UsXG4gIHF1ZXJ5UmVnRXhwOiBxdWVyeVJlZ0V4cCxcbn07XG5cbmZ1bmN0aW9uIG1lcmdlKG9iajEsIG9iajIpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICB2YXIgYXR0cjtcblxuICBmb3IgKGF0dHIgaW4gb2JqMSkge1xuICAgIHJlc3VsdFthdHRyXSA9IG9iajFbYXR0cl07XG4gIH1cblxuICBmb3IgKGF0dHIgaW4gb2JqMikge1xuICAgIHJlc3VsdFthdHRyXSA9IG9iajJbYXR0cl07XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBxdWVyeVJlZ0V4cChxdWVyeSkge1xuICByZXR1cm4gbmV3IFJlZ0V4cCgnKC4qPykoJyArIGVzY2FwZVJlZ0V4cChxdWVyeSkgKyAnKScsICdpZycpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvWy1bXFxde30oKSorPy4sXFxcXF4kfCNcXHNdL2csICdcXFxcJCYnKTtcbn1cblxuZnVuY3Rpb24gZW5jb2RlKHN0cikge1xuICByZXR1cm4gc3RyXG4gICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgLnJlcGxhY2UoLycvZywgJyYjMDM5OycpO1xufVxuIl19
