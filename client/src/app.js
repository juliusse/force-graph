const $ = require('jquery');


// models
const { Models } = require('file-graph-shared');
const DataModel = Models.DataModel;

// views
const UiElement = require('./elements/ui-element');
const Graph = require('./elements/force-graph/graph');
const NodeInfoView = require('./elements/node-info/node-info');
const TagListView = require('./elements/tag/tag-list-view');
const StaticAttributesListView = require('./elements/static-attribute/static-attribute-list-view');

const appContainer = document.querySelector('#file-graph-app');

require('./app.less');
class App extends UiElement {
    constructor(element) {
        super({
            el: element,
            cssClasses: 'file-graph-app',
            template: require('./app.pug')
        });
        this.dataModel = null;

        this.graph = null;
        this.tagList = null;

        this.selectedNode = null;
        this.displayedFileInfo = null;

        this.template();
        this.fileInfoContainer = this.findBy('.node-info-container');
        this.graphContainer = this.findBy('.graph-container');
        this.tagContainer = this.findBy('.tag-container');
        this.attributesContainer = this.findBy('.attributes-container');
    }

    loadDataModelAsync() {
        return new Promise((res) => {
            $.get('/graph')
                .done((data) => {
                    this.dataModel = DataModel.loadFromJSON(data);
                    res(this.dataModel);
                });
        });
    }

    init() {
        const width = 2500;
        const height = 2500;

        return this.loadDataModelAsync()
            .then(dataModel => {
                this.graph = new Graph(dataModel, { width, height });
                this.tagList = new TagListView(this.dataModel);
                this.attributesList = new StaticAttributesListView(this.dataModel);

                this.listenTo(this.graph, 'nodeSelected', this.onNodeSelected);

                this.graphContainer.appendChild(this.graph.el);
                this.tagContainer.appendChild(this.tagList.el);
                this.attributesContainer.appendChild(this.attributesList.el);
            })
            .then(() => this.graphContainer.scrollTo(width / 2 - 400, height / 2 - 250));
    }

    start() {
        this.graph.runSimulationFor(300);
    }

    deselectNode() {
        if (this.displayedFileInfo !== null) {
            this.displayedFileInfo.remove();
            this.selectedNode.deselect();
            this.selectedNode = null;
            this.displayedFileInfo = null;
        }
    }

    onNodeSelected(graph, { node }) {
        this.deselectNode();

        this.selectedNode = node;
        this.displayedFileInfo = new NodeInfoView(node);

        this.listenTo(this.displayedFileInfo, 'clicked:close', this.deselectNode);
        this.listenTo(this.displayedFileInfo, 'changedTags:node', this.updateNodeTags);

        this.fileInfoContainer.appendChild(this.displayedFileInfo.el);
    }

    updateNodeTags(fileInfoDialog, { node, newTagNames }) {
        node.updateTags(newTagNames, this.dataModel);
        node.save();
    }
}

const app = new App(appContainer);
app.init()
    .then(() => app.start());
