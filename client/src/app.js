const $ = require('jquery');

const appContainer = document.querySelector('#file-graph-app');
require('./app.less');

const FileGraph = require('./file-graph/file-graph');
const FileInfo = require('./file-graph/file-info');

class App {
    constructor(element) {
        this.fileGraph = null;
        this.selectedNode = null;
        this.displayedFileInfo = null;

        this.el = element;
        this.el.classList.add('file-graph-app');
        this.fileInfoContainer = document.createElement('div');
        this.fileInfoContainer.classList.add('file-info-container');

        this.graphContainer = document.createElement('div');
        this.graphContainer.classList.add('file-graph-container');

        this.el.appendChild(this.fileInfoContainer);
        this.el.appendChild(this.graphContainer);
    }

    start() {
        const width = 2500;
        const height = 2500;
        this.fileGraph = new FileGraph(width, height, this);
        this.fileGraph.loadDataAsync()
            .then(() => this.graphContainer.appendChild(this.fileGraph.el))
            .then(() => this.graphContainer.scrollTo(width / 2 - 400, height / 2 - 250));

    }

    deselectNode() {
        if (this.displayedFileInfo !== null) {
            this.fileInfoContainer.removeChild(this.displayedFileInfo.el);
            this.displayedFileInfo = null;
        }
    }

    onNodeSelected(node) {
        this.deselectNode();

        this.selectedNode = node;
        this.displayedFileInfo = new FileInfo(node.file,
            { onFileInfoClose: this.deselectNode.bind(this) });
        this.fileInfoContainer.appendChild(this.displayedFileInfo.el);

        $(this.displayedFileInfo.el).on('blur', this.deselectNode);
    }

    update(timeDeltaInSec) {
        this.fileGraph.update(timeDeltaInSec);
    }

}

const app = new App(appContainer);
app.start();

let lastRender = null;

let cycles = 0;
const times = [];

function loop(timestamp) {
    const start = Date.now();
    if (lastRender === null) {
        lastRender = timestamp;
        window.requestAnimationFrame(loop);
        return;
    }
    const progress = timestamp - lastRender;
    app.update(Math.min(500, progress));

    lastRender = timestamp;
    if (cycles < 1000) {
        setTimeout(() => window.requestAnimationFrame(loop), 40);
        times.push(Date.now() - start);
        cycles++;
    } else {
        const average = times.reduce((sum, val) => sum + val, 0) / times.length;
        console.log('average time taken: ', average, ' ms');
    }
}

window.requestAnimationFrame(loop);
