const template = `
<div class="tag"></div>`;
const UiElement = require('./ui-element');


require('./tag-view.less');
class TagView extends UiElement {
    constructor(tag) {
        super({
            cssClasses: 'tag-list-tag flex',
            template: require('./tag-view.pug')
        });
        this.tag = tag;

        this.template({
            tagName: this.tag.name
        });

        this.listenTo(this,'change:highlighted', this.updateCssClass);
    }

    updateCssClass() {
        const highlighted = this.get('highlighted');

        this.el.classList.toggle('hover', highlighted);
    }
}

module.exports = TagView;