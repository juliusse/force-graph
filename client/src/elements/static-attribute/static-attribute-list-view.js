const _ = require('lodash');
const UiElement = require('../ui-element');
const StaticAttributeGroupView = require('./static-attribute-group-view');

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

        this.template();

        this.renderAttributes(groupMap);

        this.listenTo(dataModel, 'added:static-attributes', this.renderAttributes);
        this.listenTo(dataModel, 'removed:static-attributes', this.renderAttributes);
    }

    renderAttributes(groupMap) {
        Object.keys(groupMap).forEach(group => {
            const view = new StaticAttributeGroupView(group, groupMap[group]);
            this.findBy('.attribute-groups').appendChild(view.el);
        });
    }
}

module.exports = StaticAttributeListView;