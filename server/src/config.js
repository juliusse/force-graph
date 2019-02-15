module.exports = {
    getDefaultConfig: () => ({
        client: {
            nodeForceUpdateAfterInMs: 250,
            drawEdges: true,
            forces: {
                types: {
                    repellingNodes: 1,
                    sameFolder: 0.5,
                    sameTag: 10,
                },
                edge: {
                    maxForce: 250,
                    maxDistance: 500,
                    desiredDistance: 20,
                },
                repellingNodes: {
                    desiredDistance: 200,
                    maxForce: 1000,
                }
            }
        }
    })
};
