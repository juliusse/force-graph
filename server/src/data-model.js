const _ = require('lodash');

function generateEdgeId(file1, file2) {
    const fileIds = [file1.getId(), file2.getId()];

    return fileIds.sort().join('-');
}

function removeElement(array, element) {
    const indexOfElement = array.indexOf(element);

    if (indexOfElement === -1) {
        throw new Error('element must be part of array!');
    }
    return array.slice(0, indexOfElement)
        .concat(array.slice(indexOfElement + 1, array.length));
}


class DataModel {
    constructor() {
        this._files = {};
        this._edges = {};
        this.fileTagMap = {};
        this.filePathMap = {};
    }

    get files() {
        return _.values(this._files);
    }

    get edges() {
        return _.values(this._edges);
    }

    addFile(file) {
        if (this._files[file.getId()] != null) {
            return;
        }

        // testing
        if (this.files.length >= 100) {
            return;
        }

        this._files[file.getId()] = file;

        const path = file.path;
        if (this.filePathMap[path] == null) {
            this.filePathMap[path] = [];
        }

        this.filePathMap[path].forEach((rightFile) => {
            const edgeId = generateEdgeId(file, rightFile);
            this._edges[edgeId] = {
                leftNode: file.getId(),
                rightNode: rightFile.getId(),
                tags: [],
                path
            };
        });

        this.filePathMap[path].push(file);


        file.tags.forEach(tag => {
            if (this.fileTagMap[tag] == null) {
                this.fileTagMap[tag] = [];
            }

            this.fileTagMap[tag].forEach(rightFile => {
                const edgeId = generateEdgeId(file, rightFile);
                if (this._edges[edgeId] == null) {
                    this._edges[edgeId] = {
                        leftNode: file.getId(),
                        rightNode: rightFile.getId(),
                        tags: [tag]
                    };
                    return;
                }

                const edge = this._edges[edgeId];
                edge.tags.push(tag);
            });
            this.fileTagMap[tag].push(file);
        });

    }

    updateFile(file) {
        const oldFile = this._files[file.getId()];

        const removedTags = [];
        const addedTags = [];
        file.tags.forEach(tag => {
            if (tag === '') {
                return;
            }

            if (oldFile.tags.indexOf(tag) === -1) {
                addedTags.push(tag);
            }
        });

        oldFile.tags.forEach(tag => {
            if (file.tags.indexOf(tag) === -1) {
                removedTags.push(tag);
            }
        });

        const edgesToRemove = [];
        removedTags.forEach(tag => {
            this.fileTagMap[tag] =
                removeElement(this.fileTagMap[tag], oldFile);

            this.fileTagMap[tag].forEach(otherFile => {

                const edgeId = generateEdgeId(oldFile, otherFile);
                const edge = this._edges[edgeId];

                edge.tags = removeElement(edge.tags, tag);

                if (edge.tags.length === 0 && edge.path == null) {
                    this._edges[edgeId] = undefined;
                    edgesToRemove.push(otherFile.getId());
                }
            });
        });
        oldFile.tags = file.tags;


        const edgesToAdd = [];
        addedTags.forEach(tag => {
            if (this.fileTagMap[tag] == null) {
                this.fileTagMap[tag] = [];
            }

            this.fileTagMap[tag].forEach(rightFile => {
                const edgeId = generateEdgeId(file, rightFile);
                if (this._edges[edgeId] == null) {
                    this._edges[edgeId] = {
                        leftNode: file.getId(),
                        rightNode: rightFile.getId(),
                        tags: [tag]
                    };
                    edgesToAdd.push(this._edges[edgeId]);
                    return;
                }

                const edge = this._edges[edgeId];
                edge.tags.push(tag);
            });
            this.fileTagMap[tag].push(file);
        });

        return {
            edgesToRemove,
            edgesToAdd
        };
    }
}

module.exports = DataModel;