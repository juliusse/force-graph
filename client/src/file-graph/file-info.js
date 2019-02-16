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


require('./file-info.less');
class FileInfo extends ListenableObject {
    constructor(file) {
        super();
        this.file = file;

        this.el = document.createElement('div');
        this.el.classList.add('file-info');
        this.el.classList.add('window');
        this.el.innerHTML = template;

        this.tagsField = new EditableText(file.tags.join(', '), {
            onTextChange: this.onTagsChanged.bind(this)
        });

        this.el.querySelector('.path').innerText = file.path;
        this.el.querySelector('.name').innerText = file.name;
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

module.exports = FileInfo;