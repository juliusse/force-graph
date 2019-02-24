module.exports = {
    getDefaultConfig: () => ({
        client: {
            nodeForceUpdateAfterInMs: 250,
            drawEdges: true,
            forces: {
                types: {
                    repellingNodes: 1,
                    sameTag: 10,
                    sameStaticAttribute: 0.5
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
