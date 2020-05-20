const path = require("path");

const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");
const json = require("@rollup/plugin-json");
const babel = require("rollup-plugin-babel");
const replace = require("@rollup/plugin-replace");
const { string } = require("rollup-plugin-string");
const { terser } = require("rollup-plugin-terser");
const manifest = require("./rollup-plugins/manifest-plugin");

const { options: babelOptions } = require("./babel");
const bundle = require("./bundle");

const paths = require("./paths.js");
const env = require("./env.js");

const extensions = [".js", ".ts"];

/*
TODO:
 - Deal with bundle.ignorePackages
 - Deal with bundle.emptyPackages
 - ES5 builds need to use SystemJS to handle dynamic import
   but System.import() doesn't do defer loading by default and our
   files depend on order.
 - Stats builds
 - source maps
 - Web Workers need to bundle their deps.
 - Swap out dontHash with rename based on manifest
 - Clean up manifest at end of prod build?
 - Can we put compatibility.js in entrypoint and empty it
   out in latest build?
*/

/**
 * @param {Object} arg
 * @param { import("rollup").InputOption } arg.input
 */
const createRollupConfig = ({
  entry,
  outputPath,
  defineOverlay,
  isProdBuild,
  latestBuild,
  isStatsBuild,
  publicPath,
  dontHash,
}) => {
  return {
    /**
     * @type { import("rollup").InputOptions }
     */
    inputOptions: {
      input: entry,
      // Some entry points contain no JavaScript. This setting silences a warning about that.
      // https://rollupjs.org/guide/en/#preserveentrysignatures
      preserveEntrySignatures: false,
      plugins: [
        resolve({ extensions, preferBuiltins: false, browser: true }),
        commonjs({
          namedExports: {
            "js-yaml": ["safeDump", "safeLoad"],
          },
        }),
        json(),
        babel({
          ...babelOptions({ latestBuild }),
          extensions,
        }),
        string({
          // Import certain extensions as strings
          include: ["**/*.css"],
        }),
        replace(
          bundle.definedVars({ isProdBuild, latestBuild, defineOverlay })
        ),
        manifest({
          publicPath,
        }),
        isProdBuild && terser(bundle.terserOptions(latestBuild)),
      ],
      /**
       * https://rollupjs.org/guide/en/#manualchunks
       * https://rollupjs.org/guide/en/#thisgetmoduleinfomoduleid-string--moduleinfo
       * @type { import("rollup").ManualChunksOption }
       */
      // manualChunks(id, {getModuleIds,  getModuleInfo}) {
      //   // This is the full path to the file
      //   console.log(id);
      // },
      manualChunks: {
        // Example: Put all of lit-* in 1 chunk,
        // including directives that we normally import per file.
        lit: ["lit-html", "lit-element"],
      },
    },
    /**
     * @type { import("rollup").OutputOptions }
     */
    outputOptions: {
      // https://rollupjs.org/guide/en/#outputdir
      dir: outputPath,
      // https://rollupjs.org/guide/en/#outputformat
      format: latestBuild ? "es" : "iife",
      // https://rollupjs.org/guide/en/#outputexternallivebindings
      externalLiveBindings: false,
      // https://rollupjs.org/guide/en/#outputassetfilenames
      entryFileNames: isProdBuild ? "[name]-[hash].js" : "[name].js",
    },
  };
};

const createAppConfig = ({ isProdBuild, latestBuild, isStatsBuild }) => {
  return createRollupConfig(
    bundle.config.app({
      isProdBuild,
      latestBuild,
      isStatsBuild,
    })
  );
};

const createDemoConfig = ({ isProdBuild, latestBuild, isStatsBuild }) => {
  return createRollupConfig(
    bundle.config.demo({
      isProdBuild,
      latestBuild,
      isStatsBuild,
    })
  );
};

const createCastConfig = ({ isProdBuild, latestBuild }) => {
  return createRollupConfig(bundle.config.cast({ isProdBuild, latestBuild }));
};

const createHassioConfig = ({ isProdBuild, latestBuild }) => {
  return createRollupConfig(bundle.config.hassio({ isProdBuild, latestBuild }));
};

const createGalleryConfig = ({ isProdBuild, latestBuild }) => {
  return createRollupConfig(
    bundle.config.gallery({ isProdBuild, latestBuild })
  );
};

module.exports = {
  createAppConfig,
  createDemoConfig,
  createCastConfig,
  createHassioConfig,
  createGalleryConfig,
};
