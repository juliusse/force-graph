const template = `
<div class="flex">
    <div class="title">File Info</div>
    <div class="btn-close">X</div>
</div>
<div class="group">
    <div class="label">Location</div>
    <div class="path"></div>
</div>
<div class="group">
    <div class="label">Name</div>
    <div class="name"></div>
</div>
<div class="group">
    <div class="label">Tags</div>
    <div class="tags"></div>
</div>`;

const $ = require('jquery');
const EditableText = require('../elements/editable-text');
const { ListenableObject } = require('file-graph-shared');


require('./node-info.less');
class NodeInfo extends ListenableObject {
    constructor(node) {
        super();
        this.node = node;

        this.el = document.createElement('div');
        this.el.classList.add('node-info');
        this.el.classList.add('window');
        this.el.innerHTML = template;

        this.tagsField = new EditableText(node.tags.map(t => t.name).join(', '), {
            onTextChange: this.onTagsChanged.bind(this)
        });

        this.el.querySelector('.path').innerText = node.constantAttributes.directory;
        this.el.querySelector('.name').innerText = node.name;
        this.el.querySelector('.tags').appendChild(this.tagsField.el);

        $(this.el.querySelector('.btn-close'))
            .on('click', () => this.emitEvent('clicked:close'));
    }

    onTagsChanged(editableText, text) {
        const newTags = text
            .split(',')
            .map(t => t.trim());

        this.file.tags = newTags;
        this.file.save();
    }
}

module.exports = NodeInfo;