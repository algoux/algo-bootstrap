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
    common: path.resolve(__dirname, '../common'),
  },
  chainWebpack: (config: any) => {
    config.resolve.alias.set('common', path.resolve(__dirname, '../common'));
    config.resolve.modules.add(path.resolve(__dirname, '../common'));
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    // 配置ts-loader忽略类型检查错误
    config.module
      .rule('ts')
      .use('ts-loader')
      .options({
        transpileOnly: true,
        ignoreDiagnostics: [1110],
      });
    return config;
  },
  define: {
    'process.env.NODE_ENV': process.env.NODE_ENV,
  },
  extraBabelIncludes: [path.resolve(__dirname, '../../node_modules/electron-log')],
  externals(_context: any, request: any, callback: (error: any, result: any) => void) {
    const isDev = process.env.NODE_ENV === 'development';
    let isExternal: boolean | string = false;
    const load = ['electron', 'fs', 'path', 'os', 'url', 'child_process'];
    if (load.includes(request)) {
      isExternal = `require("${request}")`;
    }
    const appDeps = Object.keys(require('../../package').dependencies);
    if (appDeps.includes(request)) {
      const orininalPath = slash(path.join(__dirname, '../../node_modules', request));
      const requireAbsolute = `require('${orininalPath}')`;
      isExternal = isDev ? requireAbsolute : `require('${request}')`;
    }
    isExternal && console.log('external dependency:', request);
    callback(null, isExternal);
  },
};
