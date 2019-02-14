class Node {
    constructor(id, label, pos = {}) {
        this.id = id;
        this.x = pos.x || Math.random() * 500;
        this.y = pos.y || Math.random() * 500;
        this.xDelta = 0;
        this.yDelta = 0;
        this.label = label;
        this.edges = [];

        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.classList.add('node');

        this.nodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.nodeSvg.setAttribute('r', '10');
        this.nodeSvg.setAttribute('fill', '#ff0000');
        this.nodeSvg.setAttribute('stroke', 'black');
        this.nodeSvg.setAttribute('strokeWidth', '1px');
        this.nodeSvg.setAttribute('cx', this.x);
        this.nodeSvg.setAttribute('cy', this.y);
        this.el.appendChild(this.nodeSvg);

        this.textSvg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textSvg.textContent = this.label;
        // this.textSvg.setAttribute('dy', '-5');

        this.textSvg.setAttribute('fill', 'black');
        this.textSvg.setAttribute('x', this.x - 15);
        this.textSvg.setAttribute('y', this.y + 6);
        this.el.appendChild(this.textSvg);


    }

    get position() {
        return {
            x: this.x + this.xDelta,
            y: this.y + this.yDelta,
        };
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
            return { x: 0, y: 0 };
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
        }, { x: 0, y: 0 });

        return {
            x: aggregatedForces.x / forces.length,
            y: aggregatedForces.y / forces.length,
        };
    }

    calculateRepellingForce(timeDelta, nodes) {
        const desiredDistance = 100;
        const maxForce = 1000;

        const forces = _.values(nodes).map(node => {
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
        }, { x: 0, y: 0 });

        return {
            x: aggregatedForces.x / forces.length,
            y: aggregatedForces.y / forces.length,
        };
    };

    update(timeDelta, nodes, center) {
        const centerDelta = { x: 0, y: 0 };//this.calculateCenterDelta(timeDelta, center);
        const edgesDelta = this.calculateEdgeForce(timeDelta);
        const repellingDelta = this.calculateRepellingForce(timeDelta, nodes);

        this.xDelta = this.xDelta + centerDelta.x + edgesDelta.x + repellingDelta.x;
        this.yDelta = this.yDelta + centerDelta.y + edgesDelta.y + repellingDelta.y;

        this.el.setAttribute('transform', `translate(${this.xDelta},${this.yDelta})`);
    }
}

module.exports = Node;