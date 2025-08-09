const merge = require('webpack-merge');
const baseConfig = require('./webpack.main.config');

module.exports = merge.smart(baseConfig, {
  devtool: 'source-map',
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          compilerOptions: {
            sourceMap: true,
          },
          transpileOnly: false,
        },
      },
    ],
  },
});
