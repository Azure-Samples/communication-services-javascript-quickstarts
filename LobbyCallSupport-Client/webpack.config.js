const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
    mode: 'development',
    entry: './index.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, './')
        },
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                './index.html'
            ]
        }),
        new webpack.DefinePlugin({
            'process.env.WEBSOCKET_URL': JSON.stringify(process.env.WEBSOCKET_URL || 'ws://localhost:7006/ws'),
            'process.env.ENABLE_WEBSOCKET': JSON.stringify(process.env.ENABLE_WEBSOCKET || 'true')
        })
    ]
};