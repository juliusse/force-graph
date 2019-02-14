const template = `
<div class="title">File Info</div>
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

require('./file-info.less');
class FileInfo {
    constructor(file) {
        this.file = file;

        this.el = document.createElement('div');
        this.el.classList.add('file-info');
        this.el.innerHTML = template;

        this.el.querySelector('.path').innerText = file.path;
        this.el.querySelector('.name').innerText = file.name;
        this.el.querySelector('.tags').innerText = file.tags.join(',');
    }
}

module.exports = FileInfo;