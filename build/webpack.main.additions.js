const webpack = require('webpack');

module.exports = {
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : 'source-map',
  output: {
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  resolve: {
    alias: {
      // '@aws-sdk/client-s3': path.resolve(__dirname, '../src/main/utils/aws-s3-stub.js')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GA_TC': JSON.stringify(
        process.env.GA_TC || ''
      ),
    }),
    new webpack.IgnorePlugin({ resourceRegExp: /^@aws-sdk\/client-s3$/ }),
  ],
};
