// Configuration for your app
// https://quasar.dev/quasar-cli/quasar-conf-js

const path = require("path");
const webpack = require("webpack");

module.exports = function (ctx) {
  return {
    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    boot: ["register.js"],

    css: ["app.scss"],

    extras: [
      // 'ionicons-v4',
      // 'mdi-v5',
      // 'fontawesome-v5',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      "roboto-font", // optional, you are not bound to it
      "material-icons", // optional, you are not bound to it
    ],

    framework: {
      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      config: {},

      // Quasar plugins
      plugins: ["Notify", "Loading"],
    },

    // animations: 'all', // --- includes all animations
    animations: [],

    // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#Property%3A-build
    build: {
      vueRouterMode: "history",

      chainWebpack(chain) {
        // chain.module
        //   .rule("vue")
        //   .use("vue-loader")
        //   .tap((options) => {
        //     options.compilerOptions = {
        //       ...options.compilerOptions,
        //       isCustomElement: (tag) => tag.startsWith("Jbw"),
        //     };
        //     return options;
        //   });

        chain.resolve.alias.merge({
          "jbw-viewer": path.resolve(__dirname, `../src/index.esm.js`),
        });

        chain.plugin("define-ui").use(webpack.DefinePlugin, [
          {
            __UI_VERSION__: `'${require("../package.json").version}'`,
          },
        ]);
      },

      extendWebpack(cfg) {
        cfg.module.rules.push({
          test: path.resolve(__dirname, "../node_modules/leader-line/"),
          use: [
            {
              loader: "skeleton-loader",
              options: {
                procedure: (content) => `${content}export default LeaderLine`,
              },
            },
          ],
        });
      },
    },

    devServer: {
      // port: 8080,
      open: true, // opens browser window automatically
    },

    ssr: {
      middlewares: [
        ctx.prod ? "compression" : "",
        "render", // keep this as last one
      ],
    },
  };
};
