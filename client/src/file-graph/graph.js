const $ = require('jquery');
const _ = require('lodash');
const { Models, Utils } = require('file-graph-shared');
const { removeElement } = Utils;
const UiElement = require('../elements/ui-element');


const { Tag } = Models;

const NodeView = require('./node-view');
const EdgeView = require('./edge-view');


class Graph extends UiElement {
    constructor(width, height, config, app, dataModel) {
        super({
            template: require('./graph.pug')
        });
        this.width = width;
        this.height = height;
        this._config = config;
        this.app = app;
        this.dataModel = dataModel;

        this.nodes = {};
        this.edges = [];
        this._tags = {};

        this.template({ width, height, addCenterCircle: true });
        this.edgeGroup = this.findBy('.edge-group');
        this.nodeGroup = this.findBy('.node-group');

        this.addCenterCircle();
        this.init(this.dataModel);

        this.listenTo(this.dataModel, 'added:edge', (dm, edge) => this.addEdge(edge));
        this.listenTo(this.dataModel, 'removed:edge', (dm, edge) => this.removeEdge(edge));
    }

    addCenterCircle() {
        this.centerCircle = this.findBy('.center-circle');
        if (this.centerCircle != null) {
            this.centerCircle.setAttribute('cx', this.width / 2);
            this.centerCircle.setAttribute('cy', this.height / 2);
        }
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
        this.edges.push(edgeView);
        if (edgeView.isVisible) {
            this.edgeGroup.appendChild(edgeView.el);
        }


        this.listenTo(edgeView, 'change:isVisible', (edgeView, isVisible) => {
            if (!this.edges.some(e => e === edgeView)) {
                // TODO correct event listening
                return;
            }

            isVisible ?
                this.edgeGroup.appendChild(edgeView.el) :
                this.edgeGroup.removeChild(edgeView.el);
        });

        return edge;
    }

    removeEdge(edgeModel) {
        const edge = this.edges.find(edgeView => {
            return edgeView.edge === edgeModel;
        });

        if (edge.isVisible) {
            this.edgeGroup.removeChild(edge.el);
        }

        this.stopListening(edge, 'change:isVisible');
        this.edges = removeElement(this.edges, edge);
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
        return this._config;
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