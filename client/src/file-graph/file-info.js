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

require('./file-info.less');
class FileInfo {
    constructor(file, listener) {
        this.file = file;
        this.listener = listener;

        this.el = document.createElement('div');
        this.el.classList.add('file-info');
        this.el.innerHTML = template;

        this.tagsField = new EditableText(file.tags.join(', '), {
            onTextChange: this.onTagsChanged.bind(this)
        });

        this.el.querySelector('.path').innerText = file.path;
        this.el.querySelector('.name').innerText = file.name;
        this.el.querySelector('.tags').appendChild(this.tagsField.el);

        $(this.el.querySelector('.btn-close')).on('click', listener.onFileInfoClose);
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