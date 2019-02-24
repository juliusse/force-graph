const _ = require('lodash');
const UiElement = require('../ui-element');
const StaticAttributeView = require('./static-attribute-view');

require('./static-attribute-list-view.less');

class StaticAttributeListView extends UiElement {
    constructor(dataModel) {
        super({
            cssClasses: 'static-attribute-list window',
            template: require('./static-attribute-list-view.pug'),
        });
        this.dataModel = dataModel;
        this.attributeElementMap = {};

        const attributes = dataModel.staticAttributes;
        const attributeGroupNames = _.uniq(attributes.map(a => a.group));
        const groupMap = {};
        attributeGroupNames.forEach(n => groupMap[n] = []);
        attributes.forEach(a => groupMap[a.group].push(a));

        this.template({attributeGroupNames});

        this.renderAttributes();

        this.listenTo(dataModel, 'added:static-attributes', this.renderAttributes);
        this.listenTo(dataModel, 'removed:static-attributes', this.renderAttributes);
    }

    renderAttributes() {
        _.values(this.attributesElementMap).forEach(view => view.remove());
        this.attributesElementMap = {};
        this.dataModel.staticAttributes.forEach(staticAttribute => {
            const view = new StaticAttributeView(staticAttribute);
            this.attributesElementMap[staticAttribute.id] = view;

            const groupEl = this.findBy('.group-'+ staticAttribute.group + ' .attributes');
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

module.exports = StaticAttributeListView;