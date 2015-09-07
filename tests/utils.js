function createInput() {
  var input = document.createElement('input');
  input.type = 'text';

  document.body.appendChild(input);
  return input;
}

function keyUp(element, key) {
  var ev = new KeyboardEvent('keyup', { key: key });

  element.dispatchEvent(ev);
  return ev;
}

module.exports = {
  createInput: createInput,
  keyUp: keyUp
};
