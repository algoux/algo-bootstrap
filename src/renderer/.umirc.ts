// const nodeExternals = require('webpack-node-externals');
import * as path from 'path';
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

export default {
  history: 'hash',
  outputPath: `../../dist/renderer`,
  publicPath: './',
  targets: {
    chrome: 120,
    edge: 120,
    firefox: 120,
    safari: 17,
    ios: 17,
    node: 'current',
  },
  minimizer: 'terserjs',
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

    // 添加 Monaco Editor Webpack Plugin
    config.plugin('monaco-editor').use(MonacoWebpackPlugin, [
      {
        languages: ['c', 'cpp'],
        features: ['coreCommands', 'find'],
        publicPath: './',
      },
    ]);

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
    'process.env.GA_TC': process.env.GA_TC,
  },
  extraBabelIncludes: [/monaco-editor/, /xterm/, /electron-log/],
  extraBabelPlugins: [
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-logical-assignment-operators',
  ],
  externals(_context: any, request: any, callback: (error: any, result: any) => void) {
    const isDev = process.env.NODE_ENV === 'development';
    let isExternal: boolean | string = false;
    const load = ['electron', 'fs', 'path', 'os', 'url', 'child_process'];
    if (load.includes(request)) {
      isExternal = `require("${request}")`;
    }
    const appDeps = Object.keys(require('../../package').dependencies);
    if (appDeps.includes(request)) {
      const orininalPath = path.join(__dirname, '../../node_modules', request).replace(/\\/g, '/');
      const requireAbsolute = `require('${orininalPath}')`;
      isExternal = isDev ? requireAbsolute : `require('${request}')`;
    }
    isExternal && console.log('external dependency:', request);
    callback(null, isExternal);
  },
};
