const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');

const configuration = require('./config');
const { Node, DataModel } = require('file-graph-shared').Models;
const dataFileName = 'filegraph.json';


function loadDataFile(baseDir) {
    const dataFile = path.join(baseDir, dataFileName);

    return fs.readFile(dataFile, 'utf8')
        .catch(() => JSON.stringify({
            version: 1,
            data: {
                nodes: [],
                tags: [],
            },
            config: configuration.getDefaultConfig(),
        }))
        .then(parseDataFileContent);
}

function parseDataFileContent(content) {
    const { data, config: configFromFile } = JSON.parse(content);

    return {
        config: _.defaultsDeep(configFromFile, configuration.getDefaultConfig()),
        dataModel: DataModel.loadFromJSON(data)
    };
}

function readDirectoryTree(baseDirectory, subDir = '') {
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
                        return readDirectoryTree(baseDirectory, path.join(subDir, fileName));
                    });
            })).then(fileArrays => _.flatten(fileArrays));
        });
}

function addUnknownFiles([{ config, dataModel }, nodeList]) {
    nodeList.forEach(node => dataModel.addNode(node));

    return { config, dataModel };
}

class Loader {
    static loadData(path) {
        return fs.stat(path)
            .then(stat => {
                return stat.isFile() ?
                    Loader.loadDataFromFile(path) :
                    Loader.loadDataFromDirectory(path);
            });
    }

    static loadDataFromDirectory(path) {
        return Promise.all([
            loadDataFile(path),
            readDirectoryTree(path)
        ]).then(addUnknownFiles);
    }

    static loadDataFromFile(path) {
        return loadDataFile('none')
            .then(({ config, dataModel }) => {
                return fs.readFile(path, 'utf8')
                    .then(data => {
                        const rows = data.split('\r\n');

                        rows.forEach(row => {
                            while (row.indexOf('\t') !== -1) {
                                row = row.replace('\t', '');
                            }

                            if (row.length === 0) {
                                return;
                            }

                            const values = row.split(';');
                            const title = values.shift();
                            const tags = values.map(v => dataModel.getTagForName(v));

                            dataModel.addNode(new Node(title, title, { tags }));
                        });

                        return { dataModel, config};
                    });
            });
    }
}

module.exports = Loader;