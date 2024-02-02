<template>
  <div class="fill-dash" :style="gridStyle"></div>
</template>

<script>
import UIElement from '../UIElement.vue';

export default {
  name: 'FillDash',
  extends: UIElement,
  props: {},
  data() {
    return {};
  },
  mounted() {
    if (this.iniType == 'ind') {
      this.$el.style.marginTop = '-10px';
    }
  },
};
</script>
