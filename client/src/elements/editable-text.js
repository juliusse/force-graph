const $ = require('jquery');
const UiElement = require('./ui-element');

require('./editable-text.less');
class EditableText extends UiElement {
    constructor(initialText) {
        super({
            cssClasses: 'editable-text',
            template: require('./editable-text.pug'),
        });
        this.text = initialText;
        this.template({
            text: this.text,
        });

        this.textField = this.findBy('.text-field');
        this.inputField = this.findBy('.input-field');

        $(this.textField).on('click', () => {
            this.inputField.value = this.text;

            this.textField.classList.add('hidden');
            this.inputField.classList.remove('hidden');

            this.inputField.focus();
        });

        $(this.inputField).on('keydown', (event) => {
            if(event.keyCode !== 13) { // Enter
                return;
            }

            this.text = this.inputField.value;
            this.textField.innerText = this.text;

            this.textField.classList.remove('hidden');
            this.inputField.classList.add('hidden');

            this.emitEvent('changed:text', this.text);
        })
    }
}

module.exports = EditableText;