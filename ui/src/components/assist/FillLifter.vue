<template>
  <div class="fill-lifter" :style="gridStyle"></div>
</template>

<script>
import UIElement from '../UIElement.vue';

export default {
  name: 'FillLifter',
  extends: UIElement,
  props: {},
  data() {
    return {};
  },
  mounted() {
    // 连接线注册 收起-展开事件
    this.$nextTick(() => {
      if (this.parentCompt != null) this.$el.addEventListener('click', this.parentCompt.foldClick);
    });
  },
};
</script>
