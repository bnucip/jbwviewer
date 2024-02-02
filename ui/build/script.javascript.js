const vuePlugin = require('rollup-plugin-vue');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const rollup = require('rollup');
const uglify = require('uglify-js');
const buble = require('@rollup/plugin-buble');
const json = require('@rollup/plugin-json');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const cjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel');
const legacy = require('@rollup/plugin-legacy');
const strip = require('@rollup/plugin-strip');

const { version } = require('../package.json');
const buildConf = require('./config');
const buildUtils = require('./utils');

// const acornClassFields = require('acorn-class-fields');
// const acornClassElements = require('acorn-private-class-elements');
// const acornStaticClassFeatures = require('acorn-static-class-features');
// const acornPrivateMethods = require('acorn-private-methods');

const cjsConfig = {
  include: [/node_modules/],
  // dynamicRequireTargets: [
  //   // include using a glob pattern (either a string or an array of strings)
  //   // 'node_modules/leader-line/*.js',

  //   // exclude files that are known to not be required dynamically, this allows for better optimizations
  //   // '!node_modules/logform/index.js',
  // ],
};

const babelConfig = {
  exclude: 'node_modules/**',
  presets: ['@quasar/babel-preset-app'],
  babelHelpers: 'runtime',
};

const rollupPlugins = [
  // A Rollup plugin to remove debugger statements and functions like assert.equal and console.log from your code.
  // strip({ functions: ['console.log'] }),
  replace({
    preventAssignment: false,
    values: {
      __UI_VERSION__: `'${version}'`,
    },
  }),
  // legacy  A Rollup plugin which adds export declarations to legacy non-module scripts.
  legacy({ 'node_modules/leader-line/leader-line.min.js': 'LeaderLine' }),
  nodeResolve({
    extensions: ['.js'],
    preferBuiltins: false,
  }),
  vuePlugin(),
  // commonjs 解决 "default" is not exported by "node_modules/xxx/index.js" 报错
  cjs(cjsConfig),
  // babel(babelConfig),
  json(),
  buble({
    objectAssign: 'Object.assign',
    transforms: {
      // make async/await work by default (no transforms)
      asyncAwait: false,
    },
  }),
];

// const acornInjectPlugins = [
//   acornClassFields,
//   acornClassElements,
//   acornStaticClassFeatures,
//   acornPrivateMethods,
// ];

const builds = [
  {
    rollup: {
      input: {
        input: pathResolve('../src/index.esm.js'),
      },
      output: {
        file: pathResolve('../dist/index.esm.js'),
        format: 'es',
      },
    },
    build: {
      // unminified: true,
      minified: true,
    },
  },
  {
    rollup: {
      input: {
        input: pathResolve('../src/index.common.js'),
      },
      output: {
        file: pathResolve('../dist/index.common.js'),
        format: 'cjs',
      },
    },
    build: {
      // unminified: true,
      minified: true,
    },
  },
  {
    rollup: {
      input: {
        input: pathResolve('../src/index.umd.js'),
      },
      output: {
        name: 'JbwViewer',
        file: pathResolve('../dist/index.umd.js'),
        format: 'umd',
      },
    },
    build: {
      unminified: true,
      minified: true,
      minExt: true,
    },
  },
];

// Add your asset folders here, if needed
// addAssets(builds, 'icon-set', 'iconSet')
// addAssets(builds, 'lang', 'lang')

build(builds);

/**
 * Helpers
 */

function pathResolve(_path) {
  return path.resolve(__dirname, _path);
}

// eslint-disable-next-line no-unused-vars
function addAssets(builds, type, injectName) {
  const files = fs.readdirSync(pathResolve('../../ui/src/components/' + type)),
    plugins = [buble(bubleConfig)],
    outputDir = pathResolve(`../dist/${type}`);

  fse.mkdirp(outputDir);

  files
    .filter((file) => file.endsWith('.js'))
    .forEach((file) => {
      const name = file
        .substr(0, file.length - 3)
        .replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      builds.push({
        rollup: {
          input: {
            input: pathResolve(`../src/components/${type}/${file}`),
            plugins,
          },
          output: {
            file: addExtension(pathResolve(`../dist/${type}/${file}`), 'umd'),
            format: 'umd',
            name: `JbwViewer.${injectName}.${name}`,
          },
        },
        build: {
          minified: true,
        },
      });
    });
}

function build(builds) {
  return Promise.all(builds.map(genConfig).map(buildEntry)).catch(
    buildUtils.logError
  );
}

function genConfig(opts) {
  Object.assign(opts.rollup.input, {
    // acornInjectPlugins: acornInjectPlugins,
    plugins: rollupPlugins,
    external: ['vue', 'quasar'],
  });

  Object.assign(opts.rollup.output, {
    banner: buildConf.banner,
    globals: { vue: 'Vue', quasar: 'Quasar' },
  });

  return opts;
}

function addExtension(filename, ext = 'min') {
  const insertionPoint = filename.lastIndexOf('.');
  return `${filename.slice(0, insertionPoint)}.${ext}${filename.slice(
    insertionPoint
  )}`;
}

function buildEntry(config) {
  return rollup
    .rollup(config.rollup.input)
    .then((bundle) => bundle.generate(config.rollup.output))
    .then(({ output }) => {
      const code =
        config.rollup.output.format === 'umd'
          ? injectVueRequirement(output[0].code)
          : output[0].code;

      return config.build.unminified
        ? buildUtils.writeFile(config.rollup.output.file, code)
        : code;
    })
    .then((code) => {
      if (!config.build.minified) {
        return code;
      }

      const minified = uglify.minify(code, {
        compress: {
          pure_funcs: ['makeMap'],
        },
      });

      if (minified.error) {
        return Promise.reject(minified.error);
      }

      return buildUtils.writeFile(
        config.build.minExt === true
          ? addExtension(config.rollup.output.file)
          : config.rollup.output.file,
        buildConf.banner + minified.code,
        true
      );
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

function injectVueRequirement(code) {
  // eslint-disable-next-line
  const index = code.indexOf(
    `Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue`
  );

  if (index === -1) {
    return code;
  }

  const checkMe = ` if (Vue === void 0) {
    console.error('[ Quasar ] Vue is required to run. Please add a script tag for it before loading Quasar.')
    return
  }
  `;

  return code.substring(0, index - 1) + checkMe + code.substring(index);
}
