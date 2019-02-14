const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');
const { File } = require('file-graph-shared');

const baseDir = process.argv[2];
const dataFileName = 'filegraph.json';
const dataFile = path.join(baseDir, dataFileName);

const files = {};

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
    filesJson.forEach(f => {
        const file = File.fromJSON(f);
        files[file.getId()] = file;
    });
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


            })).then(fileArrays => {
                return _.flatten(fileArrays);
                // if (data.files[fileName] == null) {
                //     data.files[fileName] = new File('', fileName);
                // }
            });
        });
}

function addUnknownFiles(fileList) {
    fileList.forEach(file => {
        if (files[file.getId()] == null) {
            files[file.getId()] = file;
        }
    });
}

startPromises.push(loadFile()
    .then(parseFileContent)
    .then(() => readDirectory(baseDir))
    .then(addUnknownFiles)
    .then(saveDataAsync));

function saveDataAsync() {
    const toWrite = {
        version: 1,
        files: _.values(files)
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
    const fileArray = _.values(files);
    const nodes = _.range(0,100).map(i => fileArray[i]);


    const fileFolderMap = {};
    nodes.forEach(node => {
        const path = node.path;
        if (fileFolderMap[path] == null) {
            fileFolderMap[path] = [];
        }

        fileFolderMap[path].push(node);
    });

    const fileTagMap = {};
    nodes.forEach(file => {
        file.tags.forEach(tag => {
            if(fileTagMap[tag] == null) {
                fileTagMap[tag] = [];
            }
            fileTagMap[tag].push(file);
        });
    });



    const edges = [];
    Object.keys(fileFolderMap).forEach(path => {
        const files = fileFolderMap[path];
        for (let i = 0; i < files.length; i++) {
            const curFile = files[i];
            for (let j = i + 1; j < files.length; j++) {
                edges.push({ leftNode: curFile.getId(), rightNode: files[j].getId() });
            }
        }
    });

    Object.keys(fileTagMap).forEach(tag => {
        const files = fileTagMap[tag];
        for (let i = 0; i < files.length; i++) {
            const curFile = files[i];
            for (let j = i + 1; j < files.length; j++) {
                edges.push({ leftNode: curFile.getId(), rightNode: files[j].getId() });
            }
        }
    });




    res.json({
        nodes, edges
    });
});

app.post('/file', (req, res) => {
    const sendFile = File.fromJSON(JSON.parse(req.query.file));

    const file = files[sendFile.getId()];
    file.tags = sendFile.tags;

    saveDataAsync()
        .then(() => res.sendStatus(200));
});


Promise.all(startPromises)
    .then(() => {
        app.listen(3000, function () {
            console.log('Example app listening on port 3000!');
        });
    });

