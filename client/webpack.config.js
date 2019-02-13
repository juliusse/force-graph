const path = require('path');

module.exports = {
    mode: 'development',
    devtool: 'eval-source-map',
    entry: {
        fileGraphClient: './src/app.js',
        testBundle: './test/index.js'
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'bin')
    },
    module: {
        rules: [{
            test: /\.less$/,
            use: [{
                loader: 'style-loader' // creates style nodes from JS strings
            }, {
                loader: 'css-loader' // translates CSS into CommonJS
            }, {
                loader: 'less-loader' // compiles Less to CSS
            }]
        }]
    }
};