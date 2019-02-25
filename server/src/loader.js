const path = require('path');
const fs = require('fs').promises;
const _ = require('lodash');

const configuration = require('./config');
const { Node, DataModel, StaticAttribute } = require('file-graph-shared').Models;
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
                            const staticAttributes = [
                                new StaticAttribute('directory', subDir)
                            ];
                            return [new Node(subDir + '/' + fileName, fileName, { staticAttributes })];
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
                        rows.shift();

                        rows.forEach(row => {
                            const [title, author, category, languages, state, series] =
                                row.split(';');
                            if (title === '') {
                                return;
                            }
                            const staticAttributes = [
                                dataModel.getStaticAttribute('Autor', author),
                                dataModel.getStaticAttribute('Kategorie', category),
                                dataModel.getStaticAttribute('Sprache', languages),
                                dataModel.getStaticAttribute('Status', state),
                            ];

                            if(series) {
                                staticAttributes.push(
                                    dataModel.getStaticAttribute('Reihe', series)
                                );
                            }


                            dataModel.addNode(new Node(title, title, { staticAttributes }));
                        });

                        return { dataModel, config };
                    });
            });
    }
}

module.exports = Loader;