const rollup = require("./build-scripts/rollup.js");

const config = rollup.createAppConfig({
  isProdBuild: false,
  latestBuild: true,
  isStatsBuild: false,
});

module.exports = { ...config.inputOptions, output: config.outputOptions };
