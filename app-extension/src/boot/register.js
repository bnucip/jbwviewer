import { boot } from 'quasar/wrappers'
import VuePlugin from 'quasar-ui-jbw-viewer'

export default boot(({ app }) => {
  app.use(VuePlugin)
})
