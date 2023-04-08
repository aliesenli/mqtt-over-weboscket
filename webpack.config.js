const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development', // Set to 'production' for production build
    entry: './client/index.ts', // Replace with the entry point of your application
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'], // Include .ts file extension
        fallback: { "url": require.resolve("url/") },
    },
    module: {
        rules: [
            {
                test: /\.ts$/, // Match TypeScript files
                use: 'ts-loader', // Use ts-loader to handle TypeScript files
                exclude: /node_modules/ // Exclude node_modules directory
            }
        ]
    }
};
