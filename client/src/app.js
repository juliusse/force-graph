const _ = require('lodash');
const $ = require('jquery');
const graph = require('./miserables');

const FileGraph = require('./file-graph/file-graph');
const FileInfo = require('./file-graph/file-info');
const appContainer = document.querySelector('#file-graph-app');

require('./app.less');
class App {
    constructor(element) {
        this.fileGraph = null;
        this.selectedNode = null;
        this.displayedFileInfo = null;

        this.el = element;
        this.el.classList.add('file-graph-app');
        this.fileInfoContainer = document.createElement('div');
        this.fileInfoContainer.classList.add('file-info-container');

        this.graphContainer = document.createElement('div');
        this.graphContainer.classList.add('file-graph-container');

        this.el.appendChild(this.fileInfoContainer);
        this.el.appendChild(this.graphContainer);
    }

    start() {
        this.fileGraph = new FileGraph(500,500, this);
        this.fileGraph.loadDataAsync()
            .then(() => this.graphContainer.appendChild(this.fileGraph.el));
    }

    onNodeSelected(node) {
        if(this.displayedFileInfo !== null) {
            this.fileInfoContainer.removeChild(this.displayedFileInfo.el);
            this.displayedFileInfo = null;
        }

        this.selectedNode = node;
        this.displayedFileInfo = new FileInfo(node.file);
        this.fileInfoContainer.appendChild(this.displayedFileInfo.el);
        console.log(node);
    }
}

const app = new App(appContainer);
app.start();


// $(masterSvg).on('click', () => {
//     fileGraph.addNode(Math.random, 'title');
//     const edgeToNode = _.values(nodes)[_.random(0, _.values(nodes).length - 1)];
//     addNode(node);
//
//     addEdge(node, edgeToNode);
// });



// const node = new Node('id','title');
// const node2 = new Node('id2','title');
// const edge = new Edge(node,node2);
// nodeGroup.appendChild(node.svg);
// nodeGroup.appendChild(node2.svg);
// edgeGroup.appendChild(edge.svg);
//
// nodes[node.id] = node;
// nodes[node2.id] = node2;
// edges.push(edge);

// graph.nodes.forEach(n => {
//     const node = new Node(n.id, n.id);
//     nodeGroup.appendChild(node.svg);
//
//     nodes[node.id] = node;
// });
//
// graph.links.forEach(link => {
//     const node1 = nodes[link.source];
//     const node2 = nodes[link.target];
//     const edge = new Edge(node1, node2, link.value);
//     edgeGroup.appendChild(edge.svg);
//
//     edges.push(edge);
// });

let lastRender = Date.now();

function loop() {
    const timestamp = Date.now();
    const progress = timestamp - lastRender;

    fileGraph.update(progress / 1000);

    lastRender = timestamp;
    setTimeout(loop, 500);
}

// setTimeout(loop, 1000);
