const UiElement = require('./ui-element');
const TagView = require('./tag-view');

require('./tag-list-view.less');

class TagListView extends UiElement {
    constructor(app, dataModel) {
        super({
            cssClasses: 'tag-list window',
            template: require('./tag-list-view.pug'),
        });
        this.app = app;
        this.dataModel = dataModel;
        this.tagElementMap = {};

        this.template();

        this.elTags = this.findBy('.tags');
        this.renderTags();

        this.listenTo(dataModel, 'added:tag', this.renderTags);
        this.listenTo(dataModel, 'removed:tag', this.renderTags);
    }

    renderTags() {
        _.values(this.tagElementMap).forEach(view => view.remove());
        this.tagElementMap = {};
        this.dataModel.tags.forEach(tag => {
            const tagEl = new TagView(tag);
            this.tagElementMap[tag.id] = tagEl;
            this.elTags.appendChild(tagEl.el);

            this.listenTo(tagEl, 'clicked', (tag) => {
                this.emitEvent('clicked:tag', tag.name);
            });

            this.listenTo(tagEl, 'highlighted', (tag) => {
                this.emitEvent('highlighted:tag', tag.name);
            });
        });
    }
}

module.exports = TagListView;