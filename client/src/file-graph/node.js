const $ = require('jquery');

class Node {
    constructor(fileGraph, id, file, pos = {}) {
        this.fileGraph = fileGraph;
        this.id = id;
        this.x = pos.x || Math.random() * fileGraph.width;
        this.y = pos.y || Math.random() * fileGraph.height;
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
        this.el.appendChild(this.nodeSvg);

        this.textSvg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textSvg.textContent = this.file.name;

        this.textSvg.setAttribute('fill', 'black');
        this.textSvg.setAttribute('font-size', '9px');
        this.textSvg.setAttribute('x', -15);
        this.textSvg.setAttribute('y', -5);
        this.el.appendChild(this.textSvg);


        $(this.el).on('click', () => {
            fileGraph.onNodeSelected(this);
        });
    }

    get position() {
        return {
            x: this.x,
            y: this.y,
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

        const aggregatedForces = nodes.reduce((result, node) => {
            if (node === this) {
                return result;
            }

            result.count += 1;
            const otherPosition = node.position;
            if (Math.abs(otherPosition.x - this.x) > 150 ||
                Math.abs(otherPosition.y - this.y) > 150) {
                return result;
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

            result.forceSum.x += distanceForStrength <= 0 ? 0 : (distanceInfo.x / distanceInfo.distance) * forceStrength;
            result.forceSum.y += distanceForStrength <= 0 ? 0 : (distanceInfo.y / distanceInfo.distance) * forceStrength;
            return result;
        }, { forceSum: { x: 0, y: 0 }, count: 0 });

        return {
            x: aggregatedForces.forceSum.x / aggregatedForces.count,
            y: aggregatedForces.forceSum.y / aggregatedForces.count,
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


        this.x += this.currentForce.x * timeDeltaInMs / 1000;
        this.y += this.currentForce.y * timeDeltaInMs / 1000;
        this.el.setAttribute('transform', `translate(${this.x},${this.y})`);
    }

    onFileUpdate({ edgesToAdd, edgesToRemove }) {
        console.log(arguments);
        edgesToAdd.forEach((edge) => this.fileGraph.addEdge(edge.leftNode, edge.rightNode,
            { tags: edge.tags }));
        edgesToRemove.forEach((edge) => this.fileGraph.removeEdge(this.file.getId(), edge));
    }
}

module.exports = Node;