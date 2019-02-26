const path = require('path');
const fs = require('fs').promises;

const dataFileName = 'filegraph.json';


function getDataFilePath(basePath) {

}

class Writer {
    static writeData(basePath, dataModel) {
        return fs.stat(basePath)
            .then(stat => {
                if(stat.isFile()) {
                    return;
                }

                const dataFile = path.join(basePath, dataFileName);

                const toWrite = {
                    version: 1,
                    data: dataModel.toJSON(),
                };

                return fs.writeFile(dataFile, JSON.stringify(toWrite), 'utf8');
            });
    }
}

module.exports = Writer;