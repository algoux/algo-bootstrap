const webpack = require('webpack');

module.exports = {
  devtool: '',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GA_TC': JSON.stringify(
        process.env.GA_TC || ''
      ),
    }),
  ],
};
