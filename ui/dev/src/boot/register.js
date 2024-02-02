import { boot } from "quasar/wrappers";
import JbwViewer from "jbw-viewer"; // "ui" is aliased in quasar.conf.js

export default boot(({ app }) => {
  app.use(JbwViewer);

  app.config.globalProperties.$isElectron = process.env.MODE == "electron";
});
