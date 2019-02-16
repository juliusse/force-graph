const $ = require('jquery');

const { ListenableObject } = require('file-graph-shared');

class UiElement extends ListenableObject {
    constructor({ cssClasses, template, el } = {}) {
        super();
        this.set('highlighted', false);

        this.el = el || document.createElement('div');
        this.$el = $(this.el);

        if (template) {
            this.el.innerHTML = template;
        }
        if (cssClasses) {
            cssClasses.split(' ').forEach(clazz => this.el.classList.add(clazz));
        }
        this.$el.on('click', () => this.emitEvent('clicked'));
        this.$el.on('mouseover', () => this.set('highlighted', true));
        this.$el.on('mouseout', () => this.set('highlighted', false));
    }
}

module.exports = UiElement;