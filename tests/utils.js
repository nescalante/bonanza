function createInput() {
  var input = document.createElement('input');
  input.type = 'text';

  document.body.appendChild(input);
  return input;
}

module.exports = {
  createInput: createInput
};
