(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var bonanza = require('../src');

module.exports = function () {
  bonanza(document.querySelector('#example1'), ['Bart', 'Lisa', 'Maggie']);
};

},{"../src":12}],2:[function(require,module,exports){
'use strict';

var bonanza = require('../src');
var util = require('../src/util.js');
var list = require('./list.json');

module.exports = function () {
  bonanza(document.querySelector('#example2'), request);
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .map(function (item) {
        return item.firstName + ' ' + item.lastName;
      })
      .filter(function (item) {
        return util.queryRegExp(query.search).test(item);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}

},{"../src":12,"../src/util.js":16,"./list.json":8}],3:[function(require,module,exports){
'use strict';

var bonanza = require('../src');
var util = require('../src/util.js');
var list = require('./list.json');

module.exports = function () {
  bonanza(document.querySelector('#example3'), { templates: { itemLabel: function (obj) { return obj.firstName + ' ' + obj.lastName; } } }, request);
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .filter(function (item) {
        return util.queryRegExp(query.search).test(item.firstName + ' ' + item.lastName);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}

},{"../src":12,"../src/util.js":16,"./list.json":8}],4:[function(require,module,exports){
'use strict';

var bonanza = require('../src');
var util = require('../src/util.js');
var list = require('./list.json');

module.exports = function () {
  bonanza(document.querySelector('#example4'), { templates: { itemLabel: function (obj) { return obj.firstName + ' ' + obj.lastName; } } }, request);
};

function request(query, done) {
  if (query.search.length > 3) {
    console.info('Loading using query: ', query);
    setTimeout(function () {
      var items = list
        .filter(function (item) {
          return util.queryRegExp(query.search).test(item.firstName + ' ' + item.lastName);
        })
        .slice(query.offset, query.offset + query.limit);

      done(null,
       items);
    }, 300);
  } else {
    done();
  }
}

},{"../src":12,"../src/util.js":16,"./list.json":8}],5:[function(require,module,exports){
'use strict';

var bonanza = require('../src');
var util = require('../src/util.js');
var list = require('./list.json');

module.exports = function () {
  var container = bonanza(document.querySelector('#example5'), { templates: { itemLabel: function(obj) { return obj.firstName + ' ' + obj.lastName; } } }, request);

  container.on('change', function (input) {
    alert(JSON.stringify(input));
  });
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .filter(function (item) {
        return util.queryRegExp(query.search).test(item.firstName + ' ' + item.lastName);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}

},{"../src":12,"../src/util.js":16,"./list.json":8}],6:[function(require,module,exports){
'use strict';

var bonanza = require('../src');
var util = require('../src/util.js');
var list = require('./list.json');

module.exports = function () {
  bonanza(document.querySelector('#example6'), { templates: { itemLabel: function (obj) { return obj.firstName + ' ' + obj.lastName; }, isDisabled: function (obj) { return obj.isDisabled; } } }, request);
};

function request(query, done) {
  console.info('Loading using query: ', query);
  setTimeout(function () {
    var items = list
      .filter(function (item) {
        return util.queryRegExp(query.search).test(item.firstName + ' ' + item.lastName);
      })
      .slice(query.offset, query.offset + query.limit);

    done(null,
     items);
  }, 300);
}

},{"../src":12,"../src/util.js":16,"./list.json":8}],7:[function(require,module,exports){
'use strict';

require('./example1.js')();
require('./example2.js')();
require('./example3.js')();
require('./example4.js')();
require('./example5.js')();
require('./example6.js')();


},{"./example1.js":1,"./example2.js":2,"./example3.js":3,"./example4.js":4,"./example5.js":5,"./example6.js":6}],8:[function(require,module,exports){
module.exports=[
  {
    "firstName": "Abraham",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Agnes",
    "lastName": "Skinner"
  },
  {
    "firstName": "Albert",
    "lastName": "Brooks"
  },
  {
    "firstName": "Allison",
    "lastName": "Taylor"
  },
  {
    "firstName": "Amber",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Apu",
    "lastName": "Nahasapeemapetilon"
  },
  {
    "firstName": "Aristotle",
    "lastName": "Amadopolis"
  },
  {
    "firstName": "Arnie",
    "lastName": "Pye"
  },
  {
    "firstName": "Artie",
    "lastName": "Ziff"
  },
  {
    "firstName": "Atkins",
    "lastName": "State  Comptroller"
  },
  {
    "firstName": "Baby",
    "lastName": "Gerald"
  },
  {
    "firstName": "Barney",
    "lastName": "Gumble"
  },
  {
    "firstName": "Bart",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Bernice",
    "lastName": "Hibbert"
  },
  {
    "firstName": "Birchibald 'Birch'",
    "lastName": "T. Barlow"
  },
  {
    "firstName": "Bleeding Gums",
    "lastName": "Murphy"
  },
  {
    "firstName": "Brandine",
    "lastName": "Spuckler"
  },
  {
    "firstName": "Bumblebee",
    "lastName": "Man"
  },
  {
    "firstName": "Capital City",
    "lastName": "Goofball"
  },
  {
    "firstName": "Carl",
    "lastName": "Carlson"
  },
  {
    "firstName": "Cecil",
    "lastName": "Terwilliger"
  },
  {
    "firstName": "Charles Montgomery",
    "lastName": "Burns"
  },
  {
    "firstName": "Clancy",
    "lastName": "Wiggum"
  },
  {
    "firstName": "Cletus",
    "lastName": "Spuckler"
  },
  {
    "firstName": "Coach",
    "lastName": "Lugash"
  },
  {
    "firstName": "Comic Book",
    "lastName": "Guy"
  },
  {
    "firstName": "Constance",
    "lastName": "Harm"
  },
  {
    "firstName": "Cookie",
    "lastName": "Kwan"
  },
  {
    "firstName": "Crazy Cat",
    "lastName": "Lady"
  },
  {
    "firstName": "Dave",
    "lastName": "Shutton"
  },
  {
    "firstName": "Declan",
    "lastName": "Desmond"
  },
  {
    "firstName": "Dewey",
    "lastName": "Largo"
  },
  {
    "firstName": "Disco",
    "lastName": "Stu"
  },
  {
    "firstName": "Drederick",
    "lastName": "Tatum"
  },
  {
    "firstName": "Edna",
    "lastName": "Krabappel"
  },
  {
    "firstName": "Elizabeth",
    "lastName": "Hoover"
  },
  {
    "firstName": "Fat",
    "lastName": "Tony"
  },
  {
    "firstName": "Frankie",
    "lastName": "the Squealer"
  },
  {
    "firstName": "Gary",
    "lastName": "Chalmers"
  },
  {
    "firstName": "Gil",
    "lastName": "Gunderson"
  },
  {
    "firstName": "Groundskeeper",
    "lastName": "Willie"
  },
  {
    "firstName": "Hank",
    "lastName": "Azaria"
  },
  {
    "firstName": "Hans",
    "lastName": "Moleman"
  },
  {
    "firstName": "Helen",
    "lastName": "Lovejoy"
  },
  {
    "firstName": "Herbert",
    "lastName": "Powell"
  },
  {
    "firstName": "Herman",
    "lastName": "Hermann"
  },
  {
    "firstName": "Herschel",
    "lastName": "Krustofski"
  },
  {
    "firstName": "Homer",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Horatio",
    "lastName": "McCallister"
  },
  {
    "firstName": "Hyman",
    "lastName": "Krustofski"
  },
  {
    "firstName": "J. Loren",
    "lastName": "Pryor"
  },
  {
    "firstName": "Jacqueline",
    "lastName": "Bouvier"
  },
  {
    "firstName": "Janey",
    "lastName": "Powell"
  },
  {
    "firstName": "Jasper",
    "lastName": "Beardly"
  },
  {
    "firstName": "Jebediah",
    "lastName": "Springfield"
  },
  {
    "firstName": "Jimbo",
    "lastName": "Jones"
  },
  {
    "firstName": "John",
    "lastName": "Frink"
  },
  {
    "firstName": "Johnny",
    "lastName": "Tightlips"
  },
  {
    "firstName": "Julius",
    "lastName": "Hibbert"
  },
  {
    "firstName": "Kearney",
    "lastName": "Zzyzwicz"
  },
  {
    "firstName": "Kent",
    "lastName": "Brockman"
  },
  {
    "firstName": "Kirk",
    "lastName": "Van Houten"
  },
  {
    "firstName": "Lance",
    "lastName": "Murdock"
  },
  {
    "firstName": "Lenny",
    "lastName": "Leonard"
  },
  {
    "firstName": "Lindsey",
    "lastName": "Naegle"
  },
  {
    "firstName": "Ling",
    "lastName": "Bouvier"
  },
  {
    "firstName": "Lionel",
    "lastName": "Hutz"
  },
  {
    "firstName": "Lisa",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Lois",
    "lastName": "Pennycandy"
  },
  {
    "firstName": "Luann",
    "lastName": "Van Houten"
  },
  {
    "firstName": "Lunchlady",
    "lastName": "Doris"
  },
  {
    "firstName": "Lurleen",
    "lastName": "Lumpkin"
  },
  {
    "firstName": "Maggie",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Manjula",
    "lastName": "Nahasapeemapetilon"
  },
  {
    "firstName": "Marge",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Martin",
    "lastName": "Prince"
  },
  {
    "firstName": "Marvin",
    "lastName": "Monroe"
  },
  {
    "firstName": "Mary",
    "lastName": "Bailey"
  },
  {
    "firstName": "Maude",
    "lastName": "Flanders"
  },
  {
    "firstName": "Mayor 'Diamond  Joe'",
    "lastName": "Quimby"
  },
  {
    "firstName": "Milhouse",
    "lastName": "Van Houten"
  },
  {
    "firstName": "Moe",
    "lastName": "Szyslak"
  },
  {
    "firstName": "Mona",
    "lastName": "Simpson",
    "isDisabled": true
  },
  {
    "firstName": "Mr",
    "lastName": " Teeny"
  },
  {
    "firstName": "Mr.",
    "lastName": " Costington"
  },
  {
    "firstName": "Mrs",
    "lastName": " Glick"
  },
  {
    "firstName": "Ms.",
    "lastName": "Albright"
  },
  {
    "firstName": "Ned",
    "lastName": "Flanders"
  },
  {
    "firstName": "Nelson",
    "lastName": "Muntz"
  },
  {
    "firstName": "Nick",
    "lastName": "Riviera"
  },
  {
    "firstName": "Old",
    "lastName": "Barber"
  },
  {
    "firstName": "Old",
    "lastName": "Jewish Man"
  },
  {
    "firstName": "Otto",
    "lastName": "Mann"
  },
  {
    "firstName": "Patches",
    "lastName": "and Poor Violet"
  },
  {
    "firstName": "Patty",
    "lastName": "Bouvier"
  },
  {
    "firstName": "Princess",
    "lastName": "Kashmir"
  },
  {
    "firstName": "Rachel",
    "lastName": "Jordan"
  },
  {
    "firstName": "Radioactive",
    "lastName": "Man"
  },
  {
    "firstName": "Rainier",
    "lastName": "Wolfcastle"
  },
  {
    "firstName": "Ralph",
    "lastName": "Wiggum"
  },
  {
    "firstName": "Rod",
    "lastName": "Flanders"
  },
  {
    "firstName": "Roger",
    "lastName": "Meyers Jr."
  },
  {
    "firstName": "Roy",
    "lastName": "Snyder"
  },
  {
    "firstName": "Ruth",
    "lastName": "Powers"
  },
  {
    "firstName": "Sanjay",
    "lastName": "Nahasapeemapetilon"
  },
  {
    "firstName": "Santa's",
    "lastName": "Little Helper"
  },
  {
    "firstName": "Sarah",
    "lastName": "Wiggum"
  },
  {
    "firstName": "Scott",
    "lastName": "Christian"
  },
  {
    "firstName": "Selma",
    "lastName": "Bouvier"
  },
  {
    "firstName": "Seymour",
    "lastName": "Skinner"
  },
  {
    "firstName": "Sideshow",
    "lastName": "Bob"
  },
  {
    "firstName": "Sideshow",
    "lastName": "Mel"
  },
  {
    "firstName": "Snake",
    "lastName": "Jailbird"
  },
  {
    "firstName": "Squeaky",
    "lastName": "Voiced Teen"
  },
  {
    "firstName": "The Happy",
    "lastName": "Little Elves"
  },
  {
    "firstName": "The Rich",
    "lastName": "Texan"
  },
  {
    "firstName": "Timothy",
    "lastName": "Lovejoy"
  },
  {
    "firstName": "Todd",
    "lastName": "Flanders"
  },
  {
    "firstName": "Troy",
    "lastName": "McClure"
  },
  {
    "firstName": "Waylon",
    "lastName": "Smithers"
  },
  {
    "firstName": "Wendell",
    "lastName": "Borton"
  },
  {
    "firstName": "Yes",
    "lastName": "Guy"
  }
]

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
'use strict';

var util = require('./util.js');

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
  item: function (label, search, options) {
    if (!search) {
      return label;
    }

    var regExp = util.queryRegExp(search);
    var result = '';
    var matches;
    var lastIndex;

    while (matches = regExp.exec(label)) {
      result += util.encode(matches[1]);
      result += highlight(matches[2], options);
      lastIndex = regExp.lastIndex;
    }

    if (result) {
      result += util.encode(label.substr(lastIndex));
    } else {
      result += util.encode(label);
    }

    return result;
  },

  itemLabel: function (item) { return item; },

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
  limit: 10,
  scrollDistance: 0,
  hasMoreItems: function (result) { return !!result.length && result.length === this.limit; },

  getItems: function (result) { return result; },
};

function highlight(str, options) {
  return '<span' +
    (options.css.match ? ' class="' + options.css.match + '"' : '') +
    '>' +
    util.encode(str) +
    '</span>';
}

},{"./util.js":16}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
(function (global){
'use strict';

var EventEmitter = require('events').EventEmitter;
var dom = require('./dom.js');
var defaults = require('./defaults.js');
var keys = require('./keys.js');
var list = require('./list.js');
var render = require('./render.js');
var util = require('./util.js');
var instancesCount = 0;

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
    if (options.templates.itemLabel && options.templates.label === undefined) {
      options.templates.label = options.templates.itemLabel;
    }

    options.templates = util.merge(defaults.templates, options.templates);
  }

  if (options.css) {
    options.css = util.merge(defaults.css, options.css);
  }

  options = util.merge(defaults, options);

  options.controlListId = 'bonanza-control-list-' + instancesCount;

  // aria settings
  element.setAttribute('aria-autocomplete', 'list');
  element.setAttribute('aria-expanded', 'false');
  element.setAttribute('aria-controls', options.controlListId);
  element.setAttribute('role', 'combobox');
  instancesCount += 1;

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

    element.setAttribute('aria-expanded', 'true');
  });

  context.on('close', function () {
    dataList.clean();
    dataList.hideLoading();
    dom.removeClass(element, options.css.inputLoading);
    dom.addClass(container, options.css.hide);

    element.setAttribute('aria-expanded', 'false');

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

    element.setAttribute('aria-activedescendant', selectedItem.element.getAttribute('id'));

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
},{"./defaults.js":10,"./dom.js":11,"./keys.js":13,"./list.js":14,"./render.js":15,"./util.js":16,"events":9}],13:[function(require,module,exports){
'use strict';

module.exports = {
  38: 'up',
  40: 'down',
  13: 'enter',
  27: 'escape',
};

},{}],14:[function(require,module,exports){
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

},{"./dom.js":11,"./render.js":15,"./util.js":16}],15:[function(require,module,exports){
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

},{"./util.js":16}],16:[function(require,module,exports){
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

},{}]},{},[7]);
