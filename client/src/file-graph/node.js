const $ = require('jquery');
const { ListenableObject } = require('file-graph-shared');

require('./node.less');
class Node extends ListenableObject {
    constructor(fileGraph, id, file, pos = {}) {
        super();
        this.fileGraph = fileGraph;
        this.config = this.fileGraph.config;
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

        this.set('selected', false);
        this.set('highlighted', false);


        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.el.setAttribute('transform', `translate(${this.x},${this.y})`);
        this.el.classList.add('file-graph-node');

        this.nodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.el.appendChild(this.nodeSvg);

        this.titleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        this.titleSvg.textContent = this.id;
        this.el.appendChild(this.titleSvg);

        this.textSvg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.textSvg.textContent = this.file.name;

        this.textSvg.setAttribute('x', -15);
        this.textSvg.setAttribute('y', -5);
        this.el.appendChild(this.textSvg);


        $(this.el).on('click', () => this.set('selected', true));

        $(this.el).on('mouseover', () => this.set('highlighted', true));
        $(this.el).on('mouseout', () => this.set('highlighted', false));


        this.on('change:highlighted', this.updateCssClass.bind(this));
        this.on('change:selected', this.updateCssClass.bind(this));
        this.file.on('updated', this.onFileUpdate.bind(this));
    }

    updateCssClass() {
        const selected = this.get('selected');
        const highlighted = this.get('highlighted');

        this.el.classList.toggle('hover', !selected && highlighted);
        this.el.classList.toggle('selected', selected);
    }

    deselect() {
        this.set('selected', false);
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

    onFileUpdate(file, { tagsToAdd, tagsToRemove }) {
        tagsToAdd.forEach(({ otherFile, tag }) => {
            const edge = this.getEdgeTo(otherFile) ||
                this.fileGraph.addEdge(this.id, otherFile);

            edge.addTag(tag);
        });

        tagsToRemove.forEach(({ otherFile, tag }) => this.getEdgeTo(otherFile).removeTag(tag));
    }

    getEdgeTo(nodeId) {
        return this.edges.find(edge =>
            edge.leftNode.id === nodeId || edge.rightNode.id === nodeId);
    }
}

module.exports = Node;