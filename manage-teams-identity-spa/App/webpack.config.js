const Dotenv = require('dotenv-webpack');

const environmentVariables = [
    "AAD_CLIENT_ID"
];

module.exports = {
    plugins: [
        new Dotenv({
            path: '../.env',
            safe: false,
        })
    ]
}