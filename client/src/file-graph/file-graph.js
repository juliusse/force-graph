const $ = require('jquery');
const _ = require('lodash');
const { Models, Utils, ListenableObject } = require('file-graph-shared');
const { removeElement } = Utils;


const { Tag } = Models;

const NodeView = require('./node-view');
const EdgeView = require('./edge-view');


class FileGraph extends ListenableObject {
    constructor(width, height, config, app, dataModel) {
        super();
        this.width = width;
        this.height = height;
        this._config = config;
        this.app = app;
        this.dataModel = dataModel;

        this.nodes = {};
        this.edges = [];
        this._tags = {};

        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.el.setAttribute('width', width);
        this.el.setAttribute('height', height);

        this.edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        this.el.appendChild(this.edgeGroup);
        this.el.appendChild(this.nodeGroup);

        this.listenTo(this.app, 'tick', this.onUpdate);
        this.addCenterCircle();
        this.init(this.dataModel);

        this.listenTo(this.dataModel, 'added:edge', (dm, edge) => this.addEdge(edge));
        this.listenTo(this.dataModel, 'removed:edge', (dm, edge) => this.removeEdge(edge));
    }

    addCenterCircle() {
        this.centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.centerCircle.setAttribute('r', '5');
        this.centerCircle.setAttribute('fill', '#000');
        this.centerCircle.setAttribute('stroke', 'black');
        this.centerCircle.setAttribute('strokeWidth', '1px');


        this.centerCircle.setAttribute('cx', this.width / 2);
        this.centerCircle.setAttribute('cy', this.height / 2);

        this.el.appendChild(this.centerCircle);
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

    onUpdate(app, timeDeltaInMs) {
        const nodes = _.values(this.nodes);
        _.forEach(nodes, node => {
            node.update(timeDeltaInMs, nodes, this.center);
        });

        _.forEach(this.edges, edge => {
            edge.update(timeDeltaInMs);
        });
    }
}

module.exports = FileGraph;