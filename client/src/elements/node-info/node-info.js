const $ = require('jquery');

// views
const UiElement = require('../ui-element');
const EditableText = require('../editable-text/editable-text');

require('./node-info.less');
class NodeInfo extends UiElement {
    constructor(node) {
        super({
            cssClasses: 'node-info window',
            template: require('./node-info.pug')
        });
        this.node = node;

        this.template({
            staticAttributes: node.staticAttributes,
            name: node.name
        });

        this.tagsField = new EditableText(node.tags.map(t => t.name).join(', '));
        this.findBy('.tags').appendChild(this.tagsField.el);

        $(this.el.querySelector('.btn-close'))
            .on('click', () => this.emitEvent('clicked:close'));

        this.listenTo(this.tagsField, 'changed:text', this.onTagsChanged);
    }

    onTagsChanged(editableText, text) {
        const newTagNames = _.compact(text
            .split(',')
            .map(t => t.trim()));
        this.emitEvent('changedTags:node', { node: this.node, newTagNames });
    }
}

module.exports = NodeInfo;