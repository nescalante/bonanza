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

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
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
  item: function (label, search, info, options) {
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

      return options.templates.item(itemLabel, itemLabel, search, options);
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
