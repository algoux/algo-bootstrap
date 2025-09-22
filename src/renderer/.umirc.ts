// const nodeExternals = require('webpack-node-externals');
import * as path from 'path';
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

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

    // 添加 Monaco Editor Webpack Plugin
    config.plugin('monaco-editor').use(MonacoWebpackPlugin, [{
      languages: ['c', 'cpp'],
      features: ['coreCommands', 'find'],
      publicPath: './'
    }]);

    // 处理 Monaco Editor 通过 include-loader 加载的文件 - 优先级更高
    config.module
      .rule('monaco-include')
      .enforce('pre')
      .test(/\.m?js$/)
      .include
      .add(/node_modules\/monaco-editor\/esm\/vs\/editor\/editor\.api\.js/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['last 2 versions', 'ie >= 11']
            },
            modules: 'commonjs'
          }]
        ],
        plugins: [
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-class-static-block',
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-class-static-block',
          '@babel/plugin-transform-optional-chaining',
          '@babel/plugin-transform-nullish-coalescing-operator',
          '@babel/plugin-transform-logical-assignment-operators'
        ]
      });

    // 处理 Monaco Editor 的 ES 模块 - 更精确的配置
    config.module
      .rule('monaco-js')
      .test(/\.m?js$/)
      .include
      .add(/node_modules\/monaco-editor\/esm/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['last 2 versions', 'ie >= 11']
            },
            modules: 'commonjs'
          }]
        ],
        plugins: [
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-class-static-block',
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-class-static-block',
          '@babel/plugin-transform-optional-chaining',
          '@babel/plugin-transform-nullish-coalescing-operator',
          '@babel/plugin-transform-logical-assignment-operators'
        ]
      });

    // 配置ts-loader忽略类型检查错误
    config.module
      .rule('ts')
      .use('ts-loader')
      .options({
        transpileOnly: true,
        ignoreDiagnostics: [1110],
      });

    // 处理@xterm模块的ES6+语法
    config.module
      .rule('xterm-js')
      .test(/\.js$/)
      .include
      .add(/node_modules\/@xterm/)
      .end()
      .use('babel-loader')
      .loader('babel-loader')
      .options({
        presets: [
          ['@babel/preset-env', {
            targets: {
              browsers: ['last 2 versions', 'ie >= 11']
            },
            modules: 'commonjs'
          }]
        ],
        plugins: [
          '@babel/plugin-proposal-optional-chaining',
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-class-static-block',
          '@babel/plugin-transform-class-properties',
          '@babel/plugin-transform-class-static-block',
          '@babel/plugin-transform-optional-chaining',
          '@babel/plugin-transform-nullish-coalescing-operator',
          '@babel/plugin-transform-logical-assignment-operators'
        ]
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
      const orininalPath = path.join(__dirname, '../../node_modules', request).replace(/\\/g, '/');
      const requireAbsolute = `require('${orininalPath}')`;
      isExternal = isDev ? requireAbsolute : `require('${request}')`;
    }
    isExternal && console.log('external dependency:', request);
    callback(null, isExternal);
  },
};
