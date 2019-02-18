const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');

const configuration = require('./config');
const { Node, DataModel } = require('file-graph-shared').Models;
const baseDir = process.argv[2];
const dataFileName = 'filegraph.json';
const dataFile = path.join(baseDir, dataFileName);

let dataModel = null;
let config = null;
const startPromises = [];

function loadFile() {
    return fs.readFile(dataFile, 'utf8')
        .catch(() => JSON.stringify({
            version: 1,
            data: {
                nodes: [],
                tags: [],
            },
            config: configuration.getDefaultConfig(),
        }));
}

function parseFileContent(content) {
    const { data, config: configFromFile } = JSON.parse(content);
    config = _.defaultsDeep(configFromFile, configuration.getDefaultConfig());

    dataModel = DataModel.loadFromJSON(data);
}

function readDirectory(baseDirectory, subDir = '') {
    const fullPath = path.join(baseDirectory, subDir);
    return fs.readdir(fullPath)
        .then(result => {
            return Promise.all(result.map((fileName) => {
                if (fileName === dataFileName) {
                    return Promise.resolve([]);
                }

                return fs.stat(path.join(fullPath, fileName))
                    .then(stat => {
                        if (stat.isFile()) {
                            const constantAttributes = {
                                directory: subDir
                            };
                            return [new Node(subDir + '/' + fileName, fileName, { constantAttributes })];
                        }
                        return readDirectory(baseDirectory, path.join(subDir, fileName));
                    });
            })).then(fileArrays => _.flatten(fileArrays));
        });
}

function addUnknownFiles(nodeList) {
    nodeList.forEach(node => dataModel.addNode(node));
}

startPromises.push(loadFile()
    .then(parseFileContent)
    .then(() => readDirectory(baseDir))
    .then(addUnknownFiles)
    .then(saveDataAsync));

function saveDataAsync() {
    const toWrite = {
        version: 1,
        data: dataModel.toJSON(),
        config
    };

    return fs.writeFile(dataFile, JSON.stringify(toWrite), 'utf8');
}

// app.use('*', express.bodyParser());
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

app.post('/file', (req, res) => {
    const sendFile = File.fromJSON(JSON.parse(req.query.file));
    const changes = dataModel.updateFile(sendFile);

    saveDataAsync()
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

