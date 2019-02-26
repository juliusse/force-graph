const _ = require('lodash');
const { Utils } = require('file-graph-shared');
const { removeElement } = Utils;
const UiElement = require('../elements/ui-element');


require('./edge-view.less');

class EdgeView extends UiElement {
    constructor(fileGraph, edge, leftNodeView, rightNodeView) {
        super({
            cssClasses: 'file-graph-edge',
            el: document.createElementNS('http://www.w3.org/2000/svg', 'line'),
            template: require('./edge-view.pug')
        });
        this.fileGraph = fileGraph;
        this.config = fileGraph.config;
        this.edge = edge;
        this.leftNode = leftNodeView;
        this.rightNode = rightNodeView;
        this.timeSinceLastUpdate = 0;

        this.set('isVisible', false);

        this.el.setAttribute('x1', this.leftNode.x);
        this.el.setAttribute('y1', this.leftNode.y);
        this.el.setAttribute('x2', this.rightNode.x);
        this.el.setAttribute('y2', this.rightNode.y);

        this.leftNode.edges.push(this);
        this.rightNode.edges.push(this);

        this.edge.on('change:hasSelectedNode', this.updateCssClass.bind(this));
        this.listenTo(this.edge, 'change:hasHighlightedRelative', this.updateCssClass);


        this.edge.on('change:hasSelectedNode', this.updateVisibility.bind(this));
        this.listenTo(this.edge, 'change:hasHighlightedRelative', this.updateVisibility);


        this.edge.onNodeSelectionChanged();
        this.updateVisibility();
    }

    get isVisible() {
        return this.get('isVisible');
    }

    updateVisibility() {
        if (!this.config.drawEdges) {
            return;
        }
        const isVisible = this.edge.tags.length > 0 ||
            this.edge.get('hasSelectedNode') === true ||
            this.edge.get('hasHighlightedRelative') === true;
        this.set('isVisible', isVisible);
    }

    addTag(tag) {
        this.tags.push(tag);
        this.updateVisibility();
    }

    removeTag(tag) {
        this.tags = removeElement(this.tags, tag);
        this.updateVisibility();

        if (this.tags.length === 0 && this.path == null) {
            this.edge.removeListeners();
            this.fileGraph.removeEdge(this.leftNode.id, this.rightNode.id);
        }
    }

    updateCssClass() {
        const hasSelected = this.edge.get('hasSelectedNode');
        const hasHighlightedRelative = this.edge.get('hasHighlightedRelative');

        this.el.classList.toggle('hover', !hasSelected && hasHighlightedRelative);
        this.el.classList.toggle('selected', hasSelected);
    }

    getDistanceInfo(nodeView) {
        const direction = nodeView === this.leftNode ? -1 : 1;

        const distanceX = (this.leftNode.position.x - this.rightNode.position.x);
        const distanceY = (this.leftNode.position.y - this.rightNode.position.y);
        return {
            x: distanceX * direction,
            y: distanceY * direction,
            distance: Math.sqrt(distanceX * distanceX + distanceY * distanceY),
        };
    }

    getForce() {
        const saForce = _.sum(this.edge.staticAttributes.map(sa => sa.get('force')));
        const tagForce = _.sum(this.edge.tags.map(t => t.get('force')));
        return saForce + tagForce;
    }

    update(timeDelta) {
        this.timeSinceLastUpdate += timeDelta;


        if (this.config.drawEdges &&
            (this.edge.get('hasHighlightedRelative') || this.edge.get('hasSelectedNode') || this.timeSinceLastUpdate > 1000)) {
            this.el.setAttribute('x1', this.leftNode.position.x);
            this.el.setAttribute('y1', this.leftNode.position.y);
            this.el.setAttribute('x2', this.rightNode.position.x);
            this.el.setAttribute('y2', this.rightNode.position.y);
            this.timeSinceLastUpdate = 0;
        }
    }
}

module.exports = EdgeView;