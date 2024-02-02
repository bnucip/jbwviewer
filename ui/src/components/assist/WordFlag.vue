<template>
  <div :style="gridStyle" :class="classType" @mouseup.stop="onMouseUp" @touchend.stop="changeTcType"></div>
</template>

<script>
import UIElement from '../UIElement.vue';

export default {
  name: 'WordFlag',
  extends: UIElement,
  props: {
    parentCompt: Object,
  },
  data() {
    return {};
  },
  methods: {
    onMouseUp: function (e) {
      // 鼠标右键
      if (e.button != 2) return;
      this.changeTcType();
    },

    changeTcType(e) {
      // console.log(e);
      if (!this.editable) return;
      let pCompt = this.parentCompt;
      if (pCompt == null) return;

      pCompt.changeTcType(this.column, this.iniType);
    },
  },

  computed: {
    classType: function () {
      return this.iniType;
    },
  },
};
</script>
