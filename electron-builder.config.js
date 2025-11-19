/**
 * electron-builder configuration
 * @see https://www.electron.build/configuration/configuration
 */

const os = require('os');

const platform = os.platform();
const arch = os.arch();

module.exports = {
  productName: 'Algo Bootstrap',
  appId: 'org.algoux.algo-bootstrap',
  copyright: 'Copyright © 2019-present algoUX',

  mac: {
    category: 'public.app-category.developer-tools',
    identity: null,
    target: ['dmg'],
    icon: arch === 'arm64' ? 'build/icon.icon' : 'build/icon.icns',
  },

  dmg: {
    artifactName: 'AlgoBootstrap-mac-${arch}-${version}.${ext}',
    title: '${productName} ${version}',
    icon: 'build/dmg.icns',
    background: 'build/dmg-background.tiff',
  },

  win: {
    target: ['nsis'],
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    artifactName: 'AlgoBootstrap-windows-${arch}-${version}.${ext}',
  },

  afterPack: 'scripts/after-pack.js',

  directories: {
    output: 'release',
  },

  asar: true,

  extraResources: [
    {
      from: 'dist/bin/abc',
      to: 'app/bin/abc',
      filter: ['**/*'],
    },
    {
      from: 'dist/bin/abc.bat',
      to: 'app/bin/abc.bat',
      filter: ['**/*'],
    },
    {
      from: 'dist/bin/abc.js',
      to: 'app/bin/abc.js',
      filter: ['**/*'],
    },
  ],
};
