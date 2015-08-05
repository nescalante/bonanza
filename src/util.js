'use strict';

module.exports = {
  merge: merge
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
