var express = require('express');
var app = express();
const path = require('path');
const fs = require('fs').promises;
const { File } = require('file-graph-shared');

const baseDir = process.argv[2];
const dataFileName = 'filegraph.json';
const dataFile = path.join(baseDir, dataFileName);

let data;

const startPromises = [];

startPromises.push(fs.readFile(dataFile, 'utf8')
    .catch(() => JSON.stringify({
        version: 1,
        files: {}
    }))
    .then(result => {
        data = JSON.parse(result);
    })
    .then(() => fs.readdir(baseDir))
    .then(result => {
        result.forEach((fileName) => {
            if (fileName === dataFileName) {
                return;
            }
            if (data.files[fileName] == null) {
                data.files[fileName] = new File('', fileName);
            }
        });

        return fs.writeFile(dataFile, JSON.stringify(data), 'utf8');
    }));


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'entrypoints', 'index.html'));
});

app.get('/data', (req, res) => {
    res.json(data);
});

app.use('/js', express.static('../client/bin'));
express.static('./entrypoints');

app.get('/graph', (req, res) => {
    const file1 = new File('folder/','name.png', ['house', 'boat']);
    const file2 = new File('another_folder/','image.jpg', ['house', 'horse']);

    res.json({
        nodes: [
            file1,
            file2,
        ],
        edges: [
            { leftNode: file1.getId(), rightNode: file2.getId() }
        ]
    });
});


Promise.all(startPromises)
    .then(() => {
        app.listen(3000, function () {
            console.log('Example app listening on port 3000!');
        });
    });

