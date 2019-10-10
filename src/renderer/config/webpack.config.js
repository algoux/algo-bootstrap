const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

console.log('path', require('path'.resolve(__dirname, '.')))
module.exports = {
  resolve: {
    alias: {
      // '@': require('path').resolve(__dirname, ''),
      // 'common': require('path').resolve(__dirname, 'src/common'),
    },
  },
  module: {
    rules: [{
      test: /\.js$/,
      issuer: /\.less$/,
      use: [{
        loader: 'js-to-less-loader'
      }]
    }]
  },
  plugins: [
    new MomentLocalesPlugin({
      localesToKeep: ['zh-cn'],
    }),
  ],
};
