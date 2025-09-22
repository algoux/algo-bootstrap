module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          chrome: 120,
          edge: 120,
          firefox: 120,
          safari: 17,
          ios: 17,
          node: 'current',
        },
        shippedProposals: true,
        useBuiltIns: false,
      },
    ],
  ],
  plugins: [
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-logical-assignment-operators',
  ],
};
