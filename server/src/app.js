const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');
const DataModel = require('./data-model');
const { File } = require('file-graph-shared');
const baseDir = process.argv[2];
const dataFileName = 'filegraph.json';
const dataFile = path.join(baseDir, dataFileName);

const dataModel = new DataModel();
const startPromises = [];

function loadFile() {
    return fs.readFile(dataFile, 'utf8')
        .catch(() => JSON.stringify({
            version: 1,
            files: []
        }));
}

function parseFileContent(content) {
    const filesJson = JSON.parse(content).files;
    filesJson.forEach(f => dataModel.addFile(File.fromJSON(f)));
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
                        return stat.isFile() ?
                            [new File(subDir, fileName)] :
                            readDirectory(baseDirectory, path.join(subDir, fileName));
                    });


            }))
                .then(fileArrays => _.flatten(fileArrays));
        });
}

function addUnknownFiles(fileList) {
    fileList.forEach(file => dataModel.addFile(file));
}

startPromises.push(loadFile()
    .then(parseFileContent)
    .then(() => readDirectory(baseDir))
    .then(addUnknownFiles)
    .then(saveDataAsync));

function saveDataAsync() {
    const toWrite = {
        version: 1,
        files: _.values(dataModel.files)
    };

    return fs.writeFile(dataFile, JSON.stringify(toWrite), 'utf8');
}

// app.use('*', express.bodyParser());
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'entrypoints', 'index.html'));
});

app.get('/data', (req, res) => {
    res.json(data);
});

app.use('/js', express.static('../client/bin'));
express.static('./entrypoints');

app.get('/graph', (req, res) => {
    res.json({
        nodes: dataModel.files,
        edges: dataModel.edges
    });
});

app.post('/file', (req, res) => {
    const sendFile = File.fromJSON(JSON.parse(req.query.file));
    const changes = dataModel.updateFile(sendFile);

    saveDataAsync()
        .then(() => res.send(changes));
});


Promise.all(startPromises)
    .then(() => {
        app.listen(3000, function () {
            console.log('Example app listening on port 3000!');
        });
    });

