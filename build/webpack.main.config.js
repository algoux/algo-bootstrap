const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config');

// const x = path.resolve(__dirname);

module.exports = merge.smart(baseConfig, {
  target: 'electron-main',
  entry: {
    main: './src/main/main.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src/main'),
      common: path.resolve(__dirname, '../src/common'),
      // '@aws-sdk/client-s3': path.resolve(__dirname, '../src/main/utils/empty-module.js'),
    },
  },
  externals: {
    'fs': 'commonjs fs',
    'fs/promises': 'commonjs fs/promises',
    'path': 'commonjs path',
    'process': 'commonjs process',
    'node:fs': 'commonjs fs',
    'node:fs/promises': 'commonjs fs/promises',
    'node:path': 'commonjs path',
    'node:process': 'commonjs process',
  },
  module: {
    // rules: [{
    //   test: /\.tsx?$/,
    //   loader: 'awesome-typescript-loader',
    //   exclude: /node_modules/,
    // }],
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        include: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  node: '20'
                }
              }]
            ],
            plugins: [
              '@babel/plugin-transform-optional-chaining',
              '@babel/plugin-transform-nullish-coalescing-operator',
              '@babel/plugin-transform-class-properties',
              '@babel/plugin-transform-logical-assignment-operators'
            ]
          }
        }
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      '__static': JSON.stringify(path.join(__dirname, '../static')),
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /^@aws-sdk\/client-s3$/ }),
  ],
  mode: 'development',
  node: {
    __dirname: false,
    __filename: false,
    fs: false,
    path: false,
    process: false
  }
});
