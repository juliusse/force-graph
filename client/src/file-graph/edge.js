class Edge {
    constructor(leftNode, rightNode) {
        this.leftNode = leftNode;
        this.rightNode = rightNode;

        this.el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.el.setAttribute('x1', this.leftNode.x);
        this.el.setAttribute('y1', this.leftNode.y);
        this.el.setAttribute('x2', this.rightNode.x);
        this.el.setAttribute('y2', this.rightNode.y);

        this.el.setAttribute('stroke', '#dddddd');
        this.el.setAttribute('strokeWidth', '1px');
        this.el.classList.add('edge');

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
        };
    }

    update() {
        this.el.setAttribute('x1', this.leftNode.position.x);
        this.el.setAttribute('y1', this.leftNode.position.y);
        this.el.setAttribute('x2', this.rightNode.position.x);
        this.el.setAttribute('y2', this.rightNode.position.y);
    }
}

module.exports = Edge;