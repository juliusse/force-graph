const $ = require('jquery');

class Node {
    constructor(fileGraph, id, file, pos = {}) {
        this.fileGraph = fileGraph;
        this.id = id;
        this.x = pos.x || Math.random() * fileGraph.width;
        this.y = pos.y || Math.random() * fileGraph.height;
        this.xDelta = 0;
        this.yDelta = 0;
        this.file = file;
        this.edges = [];
        this.timeSinceLastForceUpdate = 0;
        this.currentForce = {
            x: 0,
            y: 0
        };

        file.addListener(this);
        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.classList.add('node');

        this.nodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.nodeSvg.setAttribute('r', '4');
        this.nodeSvg.setAttribute('fill', 'black');
        // this.nodeSvg.setAttribute('stroke', 'black');
        // this.nodeSvg.setAttribute('strokeWidth', '1px');
        this.nodeSvg.setAttribute('cx', this.x);
        this.nodeSvg.setAttribute('cy', this.y);
        this.el.appendChild(this.nodeSvg);

        this.textSvg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textSvg.textContent = this.file.name;
        // this.textSvg.setAttribute('dy', '-5');

        this.textSvg.setAttribute('fill', 'black');
        // this.textSvg.setAttribute('font-weight', 'bold');
        this.textSvg.setAttribute('font-size', '9px');
        this.textSvg.setAttribute('x', this.x - 15);
        this.textSvg.setAttribute('y', this.y - 5);
        this.el.appendChild(this.textSvg);


        $(this.el).on('click', () => {
            fileGraph.onNodeSelected(this);
        });
    }

    get position() {
        return {
            x: this.x + this.xDelta,
            y: this.y + this.yDelta,
        };
    }

    calculateCenterDelta(center) {
        const centerForceMaxStrength = 50;
        const centerForceMaxDistance = 400;


        const distanceToCenterX = this.position.x - center.x;
        const distanceToCenterY = this.position.y - center.y;
        const distance = Math.sqrt(distanceToCenterX * distanceToCenterX + distanceToCenterY * distanceToCenterY);
        const forceStrength = Math.max(0, centerForceMaxDistance - distance) / centerForceMaxDistance * centerForceMaxStrength;


        return {
            x: (distanceToCenterX / distance) * forceStrength,
            y: (distanceToCenterY / distance) * forceStrength,
        };
    }

    calculateEdgeForce() {
        if (this.edges.length === 0) {
            return { x: 0, y: 0 };
        }
        const maxForce = 250;
        const maxDistance = 500;
        const desiredDistance = 20;

        const forces = this.edges.map(edge => {
            const distanceInfo = edge.getDistanceInfo(this);
            const distanceForStrength = distanceInfo.distance - desiredDistance;
            const forceStrength = distanceForStrength <= 0 ? 0 :
                distanceForStrength >= maxDistance ? maxForce * edge.getForce() :
                    distanceForStrength / maxDistance * maxForce * edge.getForce();

            return {
                x: distanceForStrength <= 0 ? 0 : (distanceInfo.x / distanceInfo.distance) * forceStrength,
                y: distanceForStrength <= 0 ? 0 : (distanceInfo.y / distanceInfo.distance) * forceStrength,
            };
        });

        const aggregatedForces = forces.reduce((result, force) => {
            result.x += force.x;
            result.y += force.y;
            return result;
        }, { x: 0, y: 0 });

        return {
            x: aggregatedForces.x / forces.length,
            y: aggregatedForces.y / forces.length,
        };
    }

    calculateRepellingForce(nodes) {
        const desiredDistance = 200;
        const maxForce = 1000;

        const forces = nodes.map(node => {
            if (node === this) {
                return { x: 0, y: 0 };
            }

            const distanceX = -(node.position.x - this.position.x);
            const distanceY = -(node.position.y - this.position.y);
            const distanceInfo = {
                x: distanceX,
                y: distanceY,
                distance: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
            };

            const distanceForStrength = desiredDistance - distanceInfo.distance;
            const forceStrength = distanceForStrength <= 0 ? 0 :
                distanceForStrength / desiredDistance * maxForce;
            return {
                x: distanceForStrength <= 0 ? 0 : (distanceInfo.x / distanceInfo.distance) * forceStrength,
                y: distanceForStrength <= 0 ? 0 : (distanceInfo.y / distanceInfo.distance) * forceStrength,
            };
        });

        const aggregatedForces = forces.reduce((result, force) => {
            result.x += force.x;
            result.y += force.y;
            return result;
        }, { x: 0, y: 0 });

        return {
            x: aggregatedForces.x / forces.length,
            y: aggregatedForces.y / forces.length,
        };
    };

    update(timeDeltaInMs, nodes, center) {
        this.timeSinceLastForceUpdate += timeDeltaInMs;
        // console.log(this.timeSinceLastForceUpdate)
        if (this.timeSinceLastForceUpdate > 250) {
            const centerDelta = { x: 0, y: 0 };//this.calculateCenterDelta(timeDelta, center);
            const edgesDelta = this.calculateEdgeForce();
            const repellingDelta = this.calculateRepellingForce(nodes);

            this.currentForce = {
                x: centerDelta.x + edgesDelta.x + repellingDelta.x,
                y: centerDelta.y + edgesDelta.y + repellingDelta.y
            };
            this.timeSinceLastForceUpdate = 0;
        }


        this.xDelta = this.xDelta + this.currentForce.x * timeDeltaInMs / 1000;
        this.yDelta = this.yDelta + this.currentForce.y * timeDeltaInMs / 1000;
        this.el.setAttribute('transform', `translate(${this.xDelta},${this.yDelta})`);
    }

    onFileUpdate({ edgesToAdd, edgesToRemove }) {
        console.log(arguments);
        edgesToAdd.forEach((edge) => this.fileGraph.addEdge(edge.leftNode, edge.rightNode,
            { tags: edge.tags }));
        edgesToRemove.forEach((edge) => this.fileGraph.removeEdge(this.file.getId(), edge));
    }
}

module.exports = Node;