// const nodeExternals = require('webpack-node-externals');
import slash from 'slash';
import * as path from 'path';

export default {
  history: 'hash',
  outputPath: `../../dist/renderer`,
  publicPath: './',
  plugins: [
    [
      'umi-plugin-react',
      {
        antd: true,
        dva: {
          immer: true,
        },
        dynamicImport: false,
        dll: true,
        locale: {
          enable: true,
          default: 'zh-CN',
        },
        hardSource: false,
        routes: {
          exclude: [
            /models\//,
            /services\//,
            /model\.(t|j)sx?$/,
            /service\.(t|j)sx?$/,
            /components\//,
          ],
        },
      },
    ],
  ],
  // routes: [
  //   {
  //     path: '/',
  //     component: './index',
  //   },
  // ],
  alias: {
    // '@': require('path').resolve(__dirname, 'src'),
    common: require('path').resolve(__dirname, '../../common'),
  },
  externals(_context: any, request: any, callback: (error: any, result: any) => void) {
    const isDev = process.env.NODE_ENV === 'development';
    let isExternal: boolean | string = false;
    const load = [
      'electron',
      'fs',
      'path',
      'os',
      'url',
      'child_process',
    ];
    if (load.includes(request)) {
      isExternal = `require("${request}")`;
    }
    // const appDeps = Object.keys(require('../../../package').dependencies);
    // if (appDeps.includes(request)) {
    //   console.log(request, appDeps);
    //   const orininalPath = slash(path.join(__dirname, '../../../node_modules', request));
    //   const requireAbsolute = `require('${orininalPath}')`;
    //   isExternal = isDev ? requireAbsolute : `require('${request}')`;
    // }
    callback(null, isExternal);
  },
};
