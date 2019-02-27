const _ = require('lodash');

// views
const UiElement = require('../elements/ui-element');
const NodeView = require('./node-view');
const EdgeView = require('./edge-view');

class Graph extends UiElement {
    constructor(dataModel, {width = 2500, height = 2500 } = {}) {
        super({
            template: require('./graph.pug')
        });
        this.width = width;
        this.height = height;
        this.dataModel = dataModel;

        this.nodes = {};
        this.edges = {};
        this._tags = {};

        this.template({ width, height, addCenterCircle: true });
        this.edgeGroup = this.findBy('.edge-group');
        this.nodeGroup = this.findBy('.node-group');

        this.init(this.dataModel);

        this.listenTo(this.dataModel, 'added:edge', (dm, edge) => this.addEdge(edge));
        this.listenTo(this.dataModel, 'removed:edge', (dm, edge) => this.removeEdge(edge));
    }

    addNode(node) {
        const nodeView = new NodeView(this, node);
        this.nodeGroup.appendChild(nodeView.el);
        this.nodes[nodeView.id] = nodeView;

        this.listenTo(node, 'change:selected', (node, isSelected) => {
            if (isSelected) {
                this.emitEvent('nodeSelected', { node });
            }
        });
        return nodeView;
    }

    addEdge(edge) {
        const leftNodeView = this.nodes[edge.leftNode.id];
        const rightNodeView = this.nodes[edge.rightNode.id];

        const edgeView = new EdgeView(this, edge, leftNodeView, rightNodeView);
        this.edges[edge.id] = edgeView;
        if (edgeView.isVisible) {
            this.edgeGroup.appendChild(edgeView.el);
        }


        this.listenTo(edgeView, 'change:isVisible', (edgeView, isVisible) => {
            isVisible ?
                this.edgeGroup.appendChild(edgeView.el) :
                this.edgeGroup.removeChild(edgeView.el);
        });

        return edge;
    }

    removeEdge(edgeModel) {
        const edgeView = this.edges[edgeModel.id];
        edgeView.remove();

        this.stopListening(edgeView, 'change:isVisible');
        delete this.edges[edgeModel.id];
    }

    init(dataModel) {
        dataModel.nodes.forEach(n => this.addNode(n));
        dataModel.edges.forEach(e => this.addEdge(e));
    }

    runSimulationFor(timeInSec) {
        this.simulateUntilInMs = Date.now() + timeInSec*1000;
        this.lastRender = null;
        this.renderTimes = [];

        window.requestAnimationFrame(this.simulate.bind(this));
    }

    simulate(timestamp) {
        if (this.lastRender === null) {
            this.lastRender = timestamp;
            window.requestAnimationFrame(this.simulate.bind(this));
            return;
        }
        const progress = timestamp - this.lastRender;
        this.update(Math.min(500, progress));

        this.renderTimes.push(progress);
        this.lastRender = timestamp;
        if (this.simulateUntilInMs > Date.now()) {
            setTimeout(() => window.requestAnimationFrame(this.simulate.bind(this)), 40);
        } else {
            const average = this.renderTimes.reduce((sum, val) => sum + val, 0) / this.renderTimes.length;
            console.log('average time taken: ', average, ' ms');
        }
    }

    get center() {
        return {
            x: this.width / 2,
            y: this.height / 2,
        };
    }

    get config() {
        return this.dataModel.config.client;
    }

    get tags() {
        return Object.keys(this._tags);
    }

    update(timeDeltaInMs) {
        const nodes = _.values(this.nodes);
        _.forEach(nodes, node => {
            node.update(timeDeltaInMs, nodes, this.center);
        });

        _.forEach(this.edges, edge => {
            edge.update(timeDeltaInMs);
        });
    }
}

module.exports = Graph;