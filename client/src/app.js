const _ = require('lodash');
const graph = require('./miserables');

const appContainer = document.querySelector('#file-graph-app');

const masterSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
masterSvg.classList.add('master');
masterSvg.setAttribute('width', '800');
masterSvg.setAttribute('height', '800');

const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

masterSvg.appendChild(edgeGroup);
masterSvg.appendChild(nodeGroup);

const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
centerCircle.setAttribute('r', '10');
centerCircle.setAttribute('fill', '#000');
centerCircle.setAttribute('stroke', 'black');
centerCircle.setAttribute('strokeWidth', '1px');


centerCircle.setAttribute('cx', '400');
centerCircle.setAttribute('cy', '400');

masterSvg.appendChild(centerCircle);

require('./app.less');

class Node {
    constructor(id, label) {
        this.id = id;
        this.x = Math.random() * 800;
        this.y = Math.random() * 800;
        this.label = label;
        this.edges = [];

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.svg.setAttribute('r', '10');
        this.svg.setAttribute('fill', '#ff0000');
        this.svg.setAttribute('stroke', 'black');
        this.svg.setAttribute('strokeWidth', '1px');


        this.svg.setAttribute('cx', this.x);
        this.svg.setAttribute('cy', this.y);
        this.svg.classList.add('node');
    }

    calculateCenterDelta(timeDelta, center) {
        const centerForceMaxStrength = 50;
        const centerForceMaxDistance = 400;


        const distanceToCenterX = this.x - center.x;
        const distanceToCenterY = this.y - center.y;
        const distance = Math.sqrt(distanceToCenterX * distanceToCenterX + distanceToCenterY * distanceToCenterY);
        const forceStrength = Math.max(0, centerForceMaxDistance - distance) / centerForceMaxDistance * centerForceMaxStrength;


        return {
            x: (distanceToCenterX / distance) * timeDelta * forceStrength,
            y: (distanceToCenterY / distance) * timeDelta * forceStrength,
        };
    }

    calculateEdgeForce(timeDelta) {
        const maxForce = 250;
        const maxDistance = 500;
        const desiredDistance = 50;

        const forces = this.edges.map(edge => {
            const distanceInfo = edge.getDistanceInfo(this);
            const forceStrength = Math.min(500, Math.max(0, distanceInfo.distance - desiredDistance)) / maxDistance * maxForce;

            return {
                x: (distanceInfo.x / distanceInfo.distance) * timeDelta * forceStrength,
                y: (distanceInfo.y / distanceInfo.distance) * timeDelta * forceStrength,
            };
        });

        const aggregatedForces = forces.reduce((result, force) => {
            result.x += force.x;
            result.y += force.y;
            return result;
        }, {x: 0, y: 0});

        return {
            x: aggregatedForces.x / forces.length,
            y: aggregatedForces.y / forces.length,
        }
    }

    calculateRepellingForce(timeDelta) {
        const desiredDistance = 100;
        const maxForce = 1000;

        const forces = _.values(nodes).map(node => {
            if (node === this) {
                return {x: 0, y: 0};
            }

            const distanceX = -(node.x - this.x);
            const distanceY = -(node.y - this.y);
            const distanceInfo = {
                x: distanceX,
                y: distanceY,
                distance: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
            };

            const forceStrength = Math.max(0, desiredDistance - distanceInfo.distance) / desiredDistance * maxForce;
            return {
                x: (distanceInfo.x / distanceInfo.distance) * timeDelta * forceStrength,
                y: (distanceInfo.y / distanceInfo.distance) * timeDelta * forceStrength,
            };
        });

        const aggregatedForces = forces.reduce((result, force) => {
            result.x += force.x;
            result.y += force.y;
            return result;
        }, {x: 0, y: 0});

        return {
            x: aggregatedForces.x / forces.length,
            y: aggregatedForces.y / forces.length,
        }
    };

    update(timeDelta, center) {
        const centerDelta = {x: 0, y: 0};//this.calculateCenterDelta(timeDelta, center);
        const edgesDelta = this.calculateEdgeForce(timeDelta);
        const repellingDelta = this.calculateRepellingForce(timeDelta);

        this.x = this.x + centerDelta.x + edgesDelta.x + repellingDelta.x;
        this.y = this.y + centerDelta.y + edgesDelta.y + repellingDelta.y;


        this.svg.setAttribute('cx', this.x);
        this.svg.setAttribute('cy', this.y);
    }
}

class Edge {
    constructor(leftNode, rightNode) {
        this.leftNode = leftNode;
        this.rightNode = rightNode;

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.svg.setAttribute('x1', this.leftNode.x);
        this.svg.setAttribute('y1', this.leftNode.y);
        this.svg.setAttribute('x2', this.rightNode.x);
        this.svg.setAttribute('y2', this.rightNode.y);

        this.svg.setAttribute('stroke', 'black');
        this.svg.setAttribute('strokeWidth', '1px');
        this.svg.classList.add('edge');

        this.leftNode.edges.push(this);
        this.rightNode.edges.push(this);
    }

    getDistanceInfo(node) {
        const direction = node === this.leftNode ? -1 : 1;

        const distanceX = (this.leftNode.x - this.rightNode.x);
        const distanceY = (this.leftNode.y - this.rightNode.y);
        return {
            x: distanceX * direction,
            y: distanceY * direction,
            distance: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
        }
    }

    update() {
        this.svg.setAttribute('x1', this.leftNode.x);
        this.svg.setAttribute('y1', this.leftNode.y);
        this.svg.setAttribute('x2', this.rightNode.x);
        this.svg.setAttribute('y2', this.rightNode.y);
    }
}

const nodes = {};
const edges = [];

// const node = new Node('id','title');
// const node2 = new Node('id2','title');
// const edge = new Edge(node,node2);
// nodeGroup.appendChild(node.svg);
// nodeGroup.appendChild(node2.svg);
// edgeGroup.appendChild(edge.svg);

// nodes[node.id] = node;
// nodes[node2.id] = node2;
// edges.push(edge);

graph.nodes.forEach(n => {
    const node = new Node(n.id, n.id);
    nodeGroup.appendChild(node.svg);

    nodes[node.id] = node;
});

graph.links.forEach(link => {
    const node1 = nodes[link.source];
    const node2 = nodes[link.target];
    const edge = new Edge(node1, node2, link.value);
    edgeGroup.appendChild(edge.svg);

    edges.push(edge);
});

appContainer.appendChild(masterSvg);
// appContainer.innerText = 'Hello app';

// var svg = d3.select("svg"),
//     width = +svg.attr("width"),
//     height = +svg.attr("height");
//
// var color = d3.scaleOrdinal(d3.schemeCategory10);
//
// var simulation = d3.forceSimulation()
//     .force("link", d3.forceLink().id(function (d) {
//         return d.id;
//     }))
//     .force("charge", d3.forceManyBody())
//     .force("center", d3.forceCenter(width / 2, height / 2));
//
// var link = svg.append("g")
//     .attr("class", "links")
//     .selectAll("line")
//     .data(graph.links)
//     .enter().append("line")
//     .attr("stroke-width", function (d) {
//         return Math.sqrt(d.value);
//     });
//
// var node = svg.append("g")
//     .attr("class", "nodes")
//     .selectAll("g")
//     .data(graph.nodes)
//     .enter().append("g")
//
// var circles = node.append("circle")
//     .attr("r", 5)
//     .attr("fill", function (d) {
//         return color(d.group);
//     })
//     .call(d3.drag()
//         .on("start", dragstarted)
//         .on("drag", dragged)
//         .on("end", dragended));
//
// var lables = node.append("text")
//     .text(function (d) {
//         return d.id;
//     })
//     .attr('x', 6)
//     .attr('y', 3);
//
// node.append("title")
//     .text(function (d) {
//         return d.id;
//     });
//
// simulation
//     .nodes(graph.nodes)
//     .on("tick", ticked);
//
// simulation.force("link")
//     .links(graph.links);
//
// function ticked() {
//     link
//         .attr("x1", function (d) {
//             return d.source.x;
//         })
//         .attr("y1", function (d) {
//             return d.source.y;
//         })
//         .attr("x2", function (d) {
//             return d.target.x;
//         })
//         .attr("y2", function (d) {
//             return d.target.y;
//         });
//
//     node
//         .attr("transform", function (d) {
//             return "translate(" + d.x + "," + d.y + ")";
//         })
// }
//
// function dragstarted(d) {
//     if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//     d.fx = d.x;
//     d.fy = d.y;
// }
//
// function dragged(d) {
//     d.fx = d3.event.x;
//     d.fy = d3.event.y;
// }
//
// function dragended(d) {
//     if (!d3.event.active) simulation.alphaTarget(0);
//     d.fx = null;
//     d.fy = null;
// }

function update(timeDeltaInSec) {
    _.values(nodes).forEach(node => {
        node.update(timeDeltaInSec, {x: 400, y: 400});
    });

    edges.forEach(edge => {
        edge.update();
    });
}

let lastRender = Date.now();

function loop() {
    const timestamp = Date.now();
    const progress = timestamp - lastRender;

    update(progress / 1000);

    lastRender = timestamp;
    setTimeout(loop, 200);
}

setTimeout(loop, 1000);
