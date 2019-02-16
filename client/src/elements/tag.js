const template = `
<div class="tag"></div>`;
const UiElement = require('./ui-element');


require('./tag.less');
class Tag extends UiElement {
    constructor(name) {
        super({
            cssClasses: 'tag-list-tag flex',
            template
        });
        this.name = name;

        this.nameDiv = this.el.querySelector('.tag');
        this.nameDiv.innerText = this.name;

        this.listenTo(this,'change:highlighted', this.updateCssClass);
    }

    updateCssClass() {
        const highlighted = this.get('highlighted');

        this.el.classList.toggle('hover', highlighted);
    }
}

module.exports = Tag;