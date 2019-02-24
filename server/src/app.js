const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const path = require('path');

const Loader = require('./loader');
const Writer = require('./writer');
const baseDir = process.argv[2];

let dataModel = null;
let config = null;
const startPromises = [];


startPromises.push(Loader
    .loadData(baseDir)
    .then(({ dataModel: _dataModel, config: _config}) => {
        dataModel = _dataModel;
        config = _config;
        return Writer.writeData(baseDir, dataModel, config);
    }));

app.use(bodyParser.json({}));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'entrypoints', 'index.html'));
});

app.use('/js', express.static('../client/bin'));
express.static('./entrypoints');

app.get('/graph', (req, res) => {
    res.json(dataModel.toJSON())
});

app.get('/config', (req, res) => {
    res.json({
        config: config.client
    });
});

app.post('/node', (req, res) => {
    const nodeJson = req.body.node;
    const newTags = nodeJson.tags;
    const node = dataModel._nodes[nodeJson.id];
    const changes = node.updateTags(newTags, dataModel);

    Writer.writeData(baseDir, dataModel, config)
        .then(() => res.send(changes));
});

app.post('/open/folder', (req, res) => {
    const subFolder = req.query.folder;
    `explorer "${path.join(baseDir, subFolder)}"`;
});


Promise.all(startPromises)
    .then(() => {
        app.listen(3000, function () {
            console.log('Graph backend listening on port 3000!');
        });
    });

