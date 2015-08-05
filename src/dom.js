'use strict';

module.exports = {
  addClass: addClass,
  removeClass: removeClass
};

function addClass(element, className) {
  var classes = element.className.split(' ');

  if (classes.indexOf(className) === -1) {
    element.className = (element.className + (element.className ? ' ' : '') + className);
  }
}

function removeClass(element, className) {
  var classRegex = new RegExp('\\b' + className + '\\b', 'g');
  element.className = element.className.replace(classRegex, '').replace(/  /g, ' ').trim();
}
