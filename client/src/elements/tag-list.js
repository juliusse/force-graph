const template = `
<div class="title">Tags</div>
<div class="tags"></div>`;

const $ = require('jquery');
const { ListenableObject } = require('file-graph-shared');
const Tag = require('./tag');

require('./tag-list.less');
class TagList extends ListenableObject {
    constructor(app, tags) {
        super();
        this.app = app;
        this.tags = tags;
        this.tagElementMap = {};

        this.el = document.createElement('div');
        this.el.classList.add('tag-list');
        this.el.classList.add('window');
        this.el.innerHTML = template;

        this.tags.forEach(tag => {
            const tagEl = new Tag(tag);
            this.tagElementMap[tag] = tagEl;
            this.el.appendChild(tagEl.el);

            this.listenTo(tagEl, 'clicked', (tag) => {
                this.emitEvent('clicked:tag', tag.name);
            });

            this.listenTo(tagEl, 'highlighted', (tag) => {
                this.emitEvent('highlighted:tag', tag.name);
            });
        })
    }
}

module.exports = TagList;