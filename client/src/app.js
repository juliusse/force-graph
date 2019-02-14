const _ = require('lodash');
const $ = require('jquery');
const graph = require('./miserables');

const FileGraph = require('./file-graph/file-graph');
const appContainer = document.querySelector('#file-graph-app');

require('./app.less');


const fileGraph = new FileGraph(800,500);
// fileGraph.addNode('first','first');


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

appContainer.appendChild(fileGraph.el);
fileGraph.loadDataAsync();

let lastRender = Date.now();

function loop() {
    const timestamp = Date.now();
    const progress = timestamp - lastRender;

    fileGraph.update(progress / 1000);

    lastRender = timestamp;
    setTimeout(loop, 500);
}

// setTimeout(loop, 1000);
