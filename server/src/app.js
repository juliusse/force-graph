var express = require('express');
var app = express();
const path = require('path');
const fs = require('fs').promises;
const File = require('./file');

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
    res.json({
        nodes: [{
            id: 'someId',
            label: 'label1'
        },
            {
                id: 'someId2',
                label: 'label2'
            }
        ],
        edges: [
            { leftNode: 'someId', rightNode: 'someId2', tags: ['city', 'house'] }
        ]
    });
});


Promise.all(startPromises)
    .then(() => {
        app.listen(3000, function () {
            console.log('Example app listening on port 3000!');
        });
    });

