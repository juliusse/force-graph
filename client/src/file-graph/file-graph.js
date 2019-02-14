const $ = require('jquery');

const Node = require('./node');
const Edge = require('./edge');
const { File } = require('file-graph-shared');

class FileGraph {
    constructor(width, height, app) {
        this.width = width;
        this.height = height;
        this.app = app;

        this.nodes = {};
        this.edges = [];

        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.el.setAttribute('width', width);
        this.el.setAttribute('height', height);

        this.edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        this.el.appendChild(this.edgeGroup);
        this.el.appendChild(this.nodeGroup);

        this.addCenterCircle();
        this.addEventListeners();
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

        return node;
    }

    addEdge(node1, node2) {
        const edge = new Edge(node1, node2);
        this.edges.push(edge);
        this.edgeGroup.appendChild(edge.el);

        return edge;
    }

    addEventListeners() {
        $(this.el).on('drop', event => {
            event.preventDefault();
            const edgeToNode = _.values(this.nodes)[_.random(0, _.values(this.nodes).length - 1)];

            const name = event.originalEvent.dataTransfer.items[0].getAsFile().name;
            const node = this.addNode(Math.random, name);

            this.addEdge(node, edgeToNode);
        });

        $(this.el).on('dragover', (event) => {
            event.preventDefault();
        });
    }

    loadDataAsync() {
        return $.get('/graph')
            .done((graph) => {
                graph.nodes.forEach(n => this.addNode(File.fromJSON(n)));

                graph.edges.forEach(edge => {
                    const node1 = this.nodes[edge.leftNode];
                    const node2 = this.nodes[edge.rightNode];
                    this.addEdge(node1, node2);
                });
            });
    }

    get center() {
        return {
            x: this.width / 2,
            y: this.height / 2,
        };
    }

    update(timeDeltaInSec) {
        const nodes = _.values(this.nodes);
        nodes.forEach(node => {
            node.update(timeDeltaInSec, nodes, this.center);
        });

        this.edges.forEach(edge => {
            edge.update();
        });
    }

    onNodeSelected(node) {
        this.app.onNodeSelected(node);
    }
}

module.exports = FileGraph;