const $ = require('jquery');
const _ = require('lodash');

const Node = require('./node');
const Edge = require('./edge');
const { File, Utils, ListenableObject } = require('file-graph-shared');
const { removeElement } = Utils;

class FileGraph extends ListenableObject {
    constructor(width, height, config, app) {
        super();
        this.width = width;
        this.height = height;
        this._config = config;
        this.app = app;

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

    addNode(file) {
        const node = new Node(this, file.getId(), file);
        this.nodeGroup.appendChild(node.el);
        this.nodes[node.id] = node;

        node.on('change:selected', (node, isSelected) => {
            if (isSelected) {
                this.emitEvent('nodeSelected', { node });
            }
        });
        return node;
    }

    addEdge(nodeId1, nodeId2, { tags = [], path = null } = {}) {
        const edge = new Edge(this, this.nodes[nodeId1], this.nodes[nodeId2], { tags, path });
        this.edges.push(edge);
        if (edge.isVisible) {
            this.edgeGroup.appendChild(edge.el);
        }

        tags.forEach(tag => {
            this._tags[tag] = tag;
        });

        this.listenTo(edge, 'change:isVisible', (edge, isVisible) => {
            isVisible ?
                this.edgeGroup.appendChild(edge.el) :
                this.edgeGroup.removeChild(edge.el);
        });

        return edge;
    }

    removeEdge(nodeId1, nodeId2) {
        const edge = this.edges.find(edge => {

            return (edge.leftNode.id === nodeId1 && edge.rightNode.id === nodeId2) ||
                (edge.rightNode.id === nodeId1 && edge.leftNode.id === nodeId2);
        });

        if (edge.isVisible) {
            this.edgeGroup.removeChild(edge.el);
        }
        this.edges = removeElement(this.edges, edge);
    }

    loadDataAsync() {
        return $.get('/graph')
            .done((graph) => {
                graph.nodes.forEach(n => this.addNode(File.fromJSON(n)));
                graph.edges.forEach(e => this.addEdge(e.leftNode, e.rightNode, {
                    tags: e.tags, path: e.path
                }));
            });
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