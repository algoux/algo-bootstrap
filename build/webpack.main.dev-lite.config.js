const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : 'source-map',
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  resolve: {
    alias: {
      // '@aws-sdk/client-s3': path.resolve(__dirname, '../src/main/utils/aws-s3-stub.js')
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    node: '20',
                  },
                },
              ],
            ],
            plugins: [
              '@babel/plugin-transform-optional-chaining',
              '@babel/plugin-transform-nullish-coalescing-operator',
              '@babel/plugin-transform-class-properties',
              '@babel/plugin-transform-logical-assignment-operators',
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^@aws-sdk\/client-s3$/ }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../src/main/utils/md5-worker.js'),
          to: 'utils/md5-worker.js',
        },
        {
          from: path.resolve(__dirname, '../src/main/services/magic-worker.js'),
          to: 'services/magic-worker.js',
        },
      ],
    }),
  ],
};
