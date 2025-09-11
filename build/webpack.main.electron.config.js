// for electron-webpack

module.exports =
  process.env.NODE_ENV === 'production'
    ? require('./webpack.main.prod.config')
    // : require('./webpack.main.dev.config');
    : require('./webpack.main.dev-lite.config');
