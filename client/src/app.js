const _ = require('lodash');
const $ = require('jquery');
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
        this.xDelta = 0;
        this.yDelta = 0;
        this.label = label;
        this.edges = [];

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.classList.add('node');
        
        this.nodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.nodeSvg.setAttribute('r', '10');
        this.nodeSvg.setAttribute('fill', '#ff0000');
        this.nodeSvg.setAttribute('stroke', 'black');
        this.nodeSvg.setAttribute('strokeWidth', '1px');
        this.nodeSvg.setAttribute('cx', this.x);
        this.nodeSvg.setAttribute('cy', this.y);
        this.svg.appendChild(this.nodeSvg);

        this.textSvg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textSvg.textContent = this.label;
        // this.textSvg.setAttribute('dy', '-5');

        this.textSvg.setAttribute('fill', 'black');
        this.textSvg.setAttribute('x', this.x - 15);
        this.textSvg.setAttribute('y', this.y + 6);
        this.svg.appendChild(this.textSvg);


    }

    get position() {
        return {
            x: this.x + this.xDelta,
            y: this.y + this.yDelta,
        }
    }

    calculateCenterDelta(timeDelta, center) {
        const centerForceMaxStrength = 50;
        const centerForceMaxDistance = 400;


        const distanceToCenterX = this.position.x - center.x;
        const distanceToCenterY = this.position.y - center.y;
        const distance = Math.sqrt(distanceToCenterX * distanceToCenterX + distanceToCenterY * distanceToCenterY);
        const forceStrength = Math.max(0, centerForceMaxDistance - distance) / centerForceMaxDistance * centerForceMaxStrength;


        return {
            x: (distanceToCenterX / distance) * timeDelta * forceStrength,
            y: (distanceToCenterY / distance) * timeDelta * forceStrength,
        };
    }

    calculateEdgeForce(timeDelta) {
        if (this.edges.length === 0) {
            return {x:0, y:0};
        }
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

            const distanceX = -(node.position.x - this.position.x);
            const distanceY = -(node.position.y - this.position.y);
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

        this.xDelta = this.xDelta + centerDelta.x + edgesDelta.x + repellingDelta.x;
        this.yDelta = this.yDelta + centerDelta.y + edgesDelta.y + repellingDelta.y;

        this.svg.setAttribute('transform', `translate(${this.xDelta},${this.yDelta})`);
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

        const distanceX = (this.leftNode.position.x - this.rightNode.position.x);
        const distanceY = (this.leftNode.position.y - this.rightNode.position.y);
        return {
            x: distanceX * direction,
            y: distanceY * direction,
            distance: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
        }
    }

    update() {
        this.svg.setAttribute('x1', this.leftNode.position.x);
        this.svg.setAttribute('y1', this.leftNode.position.y);
        this.svg.setAttribute('x2', this.rightNode.position.x);
        this.svg.setAttribute('y2', this.rightNode.position.y);
    }
}

const nodes = {};
const edges = [];

function addNode(node) {
    nodeGroup.appendChild(node.svg);
    nodes[node.id] = node;
}

function addEdge(node1, node2) {
    const edge = new Edge(node1, node2);
    edges.push(edge);
    edgeGroup.appendChild(edge.svg);
}

addNode(new Node('first', 'first'));

$(masterSvg).on('click', () => {
    const node = new Node(Math.random, 'title');
    const edgeToNode = _.values(nodes)[_.random(0, _.values(nodes).length-1)];
    addNode(node);

    addEdge(node, edgeToNode);
});

$(masterSvg).on('drop', function(event) {
    event.preventDefault();

    const name = event.originalEvent.dataTransfer.items[0].getAsFile().name;
    const node = new Node(Math.random, name);
    const edgeToNode = _.values(nodes)[_.random(0, _.values(nodes).length-1)];
    addNode(node);

    addEdge(node, edgeToNode);

});

$(masterSvg).on('dragover', (event) => {
    event.preventDefault();
});

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

appContainer.appendChild(masterSvg);

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
