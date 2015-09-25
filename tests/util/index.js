function createInput() {
  var input = document.createElement('input');
  input.type = 'text';
  input.setSelectionRange = { bind: Function.prototype };
  input.value = '';

  document.body.appendChild(input);
  return input;
}

function keyUp(element, key) {
  element.value = key;
  var ev = document.createEvent('KeyboardEvent');
  ev.initKeyboardEvent('keyup', true, true, null, key, key, null, null, null);

  element.dispatchEvent(ev);
  return ev;
}

function noop() {}

module.exports = {
  createInput: createInput,
  keyUp: keyUp
};
