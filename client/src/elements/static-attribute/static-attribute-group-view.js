const _ = require('lodash');
const UiElement = require('../ui-element');
const StaticAttributeView = require('./static-attribute-view');
const EditableText = require('../editable-text');

require('./static-attribute-group-view.less');

class StaticAttributeGroupView extends UiElement {
    constructor(groupName, staticAttributes) {
        super({
            cssClasses: 'static-attribute-group group-'+groupName,
            template: require('./static-attribute-group-view.pug'),
        });
        this.groupName = groupName;
        this.staticAttributes = staticAttributes;
        this.force = staticAttributes[0].get('force');

        this.forceInput = new EditableText(this.force);

        this.template({groupName});
        this.findBy('.force-field').appendChild(this.forceInput.el);

        this.renderAttributes();

        this.listenTo(this.forceInput, 'changed:text', (input, force) => this.updateForce(+force));
    }

    updateForce(force) {
        this.staticAttributes.forEach(sa => sa.set('force', force));
    }

    renderAttributes() {
        _.values(this.attributesElementMap).forEach(view => view.remove());
        this.attributesElementMap = {};
        this.staticAttributes.forEach(staticAttribute => {
            const view = new StaticAttributeView(staticAttribute);
            this.attributesElementMap[staticAttribute.id] = view;

            const groupEl = this.findBy('.attributes');
            groupEl.appendChild(view.el);

            this.listenTo(view, 'clicked', (view, sa) => {
                this.emitEvent('clicked:static-attribute', sa);
            });

            this.listenTo(view, 'highlighted', (view, sa) => {
                this.emitEvent('highlighted:static-attribute', sa);
            });
        });
    }
}

module.exports = StaticAttributeGroupView;