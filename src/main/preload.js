process.once('loaded', () => {
  window.__devtron = {
    require: require,
    process: process
  };
});
