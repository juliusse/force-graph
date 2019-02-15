const _ = require('lodash');
const { removeElement } = require('file-graph-shared').Utils;

function generateEdgeId(file1, file2) {
    const fileIds = [file1.getId(), file2.getId()];

    return fileIds.sort().join('-');
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
        if (this.files.length >= 50) {
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

    updateFile(sendFile) {
        const file = this._files[sendFile.getId()];

        const removedTags = [];
        const addedTags = [];
        sendFile.tags.forEach(tag => {
            if (tag.trim() === '') {
                return;
            }

            if (file.tags.indexOf(tag) === -1) {
                addedTags.push(tag);
            }
        });

        file.tags.forEach(tag => {
            if (sendFile.tags.indexOf(tag) === -1) {
                removedTags.push(tag);
            }
        });

        const tagsToRemove = [];
        removedTags.forEach(tag => {
            this.fileTagMap[tag] =
                removeElement(this.fileTagMap[tag], file);

            this.fileTagMap[tag].forEach(otherFile => {

                const edgeId = generateEdgeId(file, otherFile);
                const edge = this._edges[edgeId];

                edge.tags = removeElement(edge.tags, tag);

                if (edge.tags.length === 0 && edge.path == null) {
                    delete this._edges[edgeId];
                }
                tagsToRemove.push({ otherFile: otherFile.getId(), tag});
            });
        });
        file.tags = sendFile.tags;


        const tagsToAdd = [];
        addedTags.forEach(tag => {
            if (this.fileTagMap[tag] == null) {
                this.fileTagMap[tag] = [];
            }

            this.fileTagMap[tag].forEach(rightFile => {
                const edgeId = generateEdgeId(sendFile, rightFile);
                if (this._edges[edgeId] == null) {
                    this._edges[edgeId] = {
                        leftNode: sendFile.getId(),
                        rightNode: rightFile.getId(),
                        tags: []
                    };
                }

                const edge = this._edges[edgeId];
                edge.tags.push(tag);
                tagsToAdd.push({ otherFile: rightFile.getId(), tag});
            });
            this.fileTagMap[tag].push(file);
        });

        return {
            tagsToAdd,
            tagsToRemove
        };
    }
}

module.exports = DataModel;