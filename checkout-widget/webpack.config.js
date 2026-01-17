const path = require('path');

module.exports = {
    entry: './src/sdk/PaymentGateway.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'checkout.js',
        library: {
            name: 'PaymentGateway',
            type: 'umd',
            export: 'default'
        },
        globalObject: 'this'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ],
    },
};
