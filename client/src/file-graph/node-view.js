const $ = require('jquery');
const UiElement = require('../elements/ui-element');

require('./node-view.less');

class NodeView extends UiElement {
    constructor(fileGraph, node, pos = {}) {
        super({
            cssClasses: 'file-graph-node',
            el: document.createElementNS('http://www.w3.org/2000/svg', 'g'),
            template: require('./node-view.pug')
        });
        this.fileGraph = fileGraph;
        this.config = this.fileGraph.config;
        this.id = node.id;
        this.x = pos.x || Math.random() * fileGraph.width;
        this.y = pos.y || Math.random() * fileGraph.height;
        this.node = node;
        this.edges = [];
        this.timeSinceLastForceUpdate = 0;
        this.currentForce = {
            x: 0,
            y: 0
        };

        this.set('selected', false);

        this.template({
            nodeId: node.id,
            nodeName: node.name
        });

        this.el.setAttribute('transform', `translate(${this.x},${this.y})`);

        this.listenTo(this, 'clicked', () => this.node.set('selected', true));
        this.listenTo(this, 'change:highlighted', (view, value) =>
            this.node.highlighted = value);

        this.listenTo(this.node, 'change:highlighted', this.updateCssClass);
        this.listenTo(this.node, 'change:selected', this.updateCssClass);
    }

    updateCssClass() {
        const selected = this.node.get('selected');
        const highlighted = this.node.get('highlighted');

        this.el.classList.toggle('hover', !selected && highlighted);
        this.el.classList.toggle('selected', selected);
    }

    deselect() {
        this.node.set('selected', false);
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
        const maxForce = this.config.forces.edge.maxForce;
        const maxDistance = this.config.forces.edge.maxDistance;
        const desiredDistance = this.config.forces.edge.desiredDistance;

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
        const desiredDistance = this.config.forces.repellingNodes.desiredDistance;
        const maxForce = this.config.forces.repellingNodes.maxForce;
        const forceFactor = this.config.forces.types.repellingNodes;

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
                distanceForStrength / desiredDistance * maxForce * forceFactor;

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
        if (this.timeSinceLastForceUpdate > this.config.nodeForceUpdateAfterInMs) {
            const centerDelta = { x: 0, y: 0 };
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

    getEdgeTo(nodeId) {
        return this.edges.find(edge =>
            edge.leftNode.id === nodeId || edge.rightNode.id === nodeId);
    }
}

module.exports = NodeView;