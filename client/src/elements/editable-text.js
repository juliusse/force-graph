const $ = require('jquery');

require('./editable-text.less');
class EditableText {
    constructor(initialText, listener) {
        this.listener = listener;
        this.text = initialText;

        this.el = document.createElement('div');
        this.el.classList.add('editable-text');

        this.textField = document.createElement('div');
        this.textField.classList.add('text-field');
        this.textField.innerText = this.text;

        this.inputField = document.createElement('input');
        this.inputField.classList.add('input-field');
        this.inputField.classList.add('hidden');

        this.el.appendChild(this.textField);
        this.el.appendChild(this.inputField);

        $(this.textField).on('click', () => {
            this.inputField.value = this.text;

            this.textField.classList.add('hidden');
            this.inputField.classList.remove('hidden');

            this.inputField.focus();
        })

        $(this.inputField).on('keydown', (event) => {
            if(event.keyCode !== 13) { // Enter
                return;
            }

            this.text = this.inputField.value;
            this.textField.innerText = this.text;

            this.textField.classList.remove('hidden');
            this.inputField.classList.add('hidden');

            this.listener.onTextChange(this, this.text);
        })
    }
}

module.exports = EditableText;