const UiElement = require('../ui-element');

require('./static-attribute-view.less');
class StaticAttributeView extends UiElement {
    constructor(staticAttribute) {
        super({
            cssClasses: 'static-attribute flex',
            template: require('./static-attribute-view.pug')
        });
        this.staticAttribute = staticAttribute;

        this.template({
            value: staticAttribute.value
        });

        this.listenTo(this,'change:highlighted', this.updateCssClass);
        this.listenTo(this,'change:highlighted', (self, val) => self.staticAttribute.highlighted = val);
    }

    updateCssClass() {
        const highlighted = this.get('highlighted');

        this.el.classList.toggle('hover', highlighted);
    }
}

module.exports = StaticAttributeView;