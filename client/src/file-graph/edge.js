const { Utils, ListenableObject } = require('file-graph-shared');
const { removeElement } = Utils;

require('./edge.less');
class Edge extends ListenableObject {
    constructor(fileGraph, leftNode, rightNode, { path = null, tags = [] } = {}, draw = true) {
        super();
        this.fileGraph = fileGraph;
        this.config = fileGraph.config;
        this.leftNode = leftNode;
        this.rightNode = rightNode;
        this.path = path;
        this.tags = tags;
        this.timeSinceLastUpdate = 0;
        this.draw = draw;

        this.set('isVisible', false);

        this.state = new ListenableObject({
            hasHighlightedNode: false,
            hasSelectedNode: false
        });

        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.el.setAttribute('x1', this.leftNode.x);
        this.el.setAttribute('y1', this.leftNode.y);
        this.el.setAttribute('x2', this.rightNode.x);
        this.el.setAttribute('y2', this.rightNode.y);
        this.el.classList.add('file-graph-edge');

        this.leftNode.edges.push(this);
        this.rightNode.edges.push(this);

        this.leftNode.on('change:selected', this.onNodeSelectionChanged.bind(this));
        this.rightNode.on('change:selected', this.onNodeSelectionChanged.bind(this));
        this.leftNode.on('change:highlighted', this.onNodeSelectionChanged.bind(this));
        this.rightNode.on('change:highlighted', this.onNodeSelectionChanged.bind(this));

        this.state.on('change:hasHighlightedNode', this.updateCssClass.bind(this));
        this.state.on('change:hasSelectedNode', this.updateCssClass.bind(this));

        this.state.on('change:hasHighlightedNode', this.updateVisibility.bind(this));
        this.state.on('change:hasSelectedNode', this.updateVisibility.bind(this));

        this.updateVisibility();
    }

    get isVisible() {
        return this.get('isVisible');
    }

    updateVisibility() {
        if(!this.config.drawEdges) {
            return;
        }
        const isVisible = this.tags.length > 0 ||
            this.state.get('hasHighlightedNode') === true ||
            this.state.get('hasSelectedNode') === true;
        this.set('isVisible', isVisible);
    }

    addTag(tag) {
        this.tags.push(tag);
        if (this.tags.length === 1) {
            this.fileGraph.onEdgeShown(this);
        }
    }

    removeTag(tag) {
        this.tags = removeElement(this.tags, tag);

        if (this.tags.length === 0) {
            this.fileGraph.onEdgeHidden(this);
        }
        if (this.tags.length === 0 && this.path == null) {
            this.fileGraph.removeEdge(this.leftNode.id, this.rightNode.id);
        }
    }

    updateCssClass() {
        const hasSelected = this.state.get('hasSelectedNode');
        const hasHighlighted = this.state.get('hasHighlightedNode');

        this.el.classList.toggle('hover', !hasSelected && hasHighlighted);
        this.el.classList.toggle('selected', hasSelected);
    }

    onNodeSelectionChanged() {
        const hasHighlightedNode =
            this.leftNode.get('highlighted') || this.rightNode.get('highlighted');
        const hasSelectedNode =
            this.leftNode.get('selected') || this.rightNode.get('selected');
        this.state.set('hasHighlightedNode', hasHighlightedNode);
        this.state.set('hasSelectedNode', hasSelectedNode);
    }

    getDistanceInfo(node) {
        const direction = node === this.leftNode ? -1 : 1;

        const distanceX = (this.leftNode.position.x - this.rightNode.position.x);
        const distanceY = (this.leftNode.position.y - this.rightNode.position.y);
        return {
            x: distanceX * direction,
            y: distanceY * direction,
            distance: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
        };
    }

    getForce() {
        const pathForce = this.path != null ? this.config.forces.types.sameFolder : 0;
        const tagForce = this.tags.length * this.config.forces.types.sameTag;
        return pathForce + tagForce;
    }

    update(timeDelta) {
        this.timeSinceLastUpdate += timeDelta;

        if (this.config.drawEdges && this.timeSinceLastUpdate > 1000) {
            this.el.setAttribute('x1', this.leftNode.position.x);
            this.el.setAttribute('y1', this.leftNode.position.y);
            this.el.setAttribute('x2', this.rightNode.position.x);
            this.el.setAttribute('y2', this.rightNode.position.y);
            this.timeSinceLastUpdate = 0;
        }
    }
}

module.exports = Edge;