<template>
  <div :class="classType" :style="gridStyle" @mouseup="onMouseUp"></div>
</template>

<script>
import GridUtil from '../../api/grid_util';
import XmlTags from '../../api/xml_tags';
// import BaseCompt from '../BaseCompt.vue';
import UIElement from '../UIElement.vue';
// import SbjSep from './SbjSep.vue';
// import ObjSep from './ObjSep.vue';

export default {
  name: 'ObjSep',
  extends: UIElement,
  props: {},
  setup(props, ctx) {
    return { ...UIElement.setup(props, ctx) };
  },
  data() {
    return {
      classType: 'obj-sep',
    };
  },
  methods: {
    onMouseUp: function (e) {
      // 鼠标右键
      if (e.button != 2 || !this.editable) return;

      // console.log(121);
      if (this.iniType == XmlTags.A_Inv) this.updateParentItem('iniType', '');
      else {
        // 约束：成分复句中不能有倒装
        if (this.parentCompt.isInStack && !this.parentCompt.isMainSent) return;

        // 约束：双宾语不能倒装
        let prd = GridUtil.findElemsByCol(this.parentCompt, 1, this.column, 'BaseCompt')
          .filter((o) => o.column < this.column && o.iniType == XmlTags.C_Wei)
          .lastOrDefault();
        let col = prd.column;
        let end = col + prd.rightRegion();
        if (GridUtil.findElemsByCol(this.parentCompt, col, end, 'ObjSep').some((o) => o.column != this.column)) return;

        // 约束：同一主干线，主、宾倒装只能存在一个
        let shiftSbj = GridUtil.findElemsByCol(this.parentCompt, null, null, 'SbjSep').firstOrDefault((o) => o.isShift);
        if (shiftSbj != null) shiftSbj.updateParentItem('iniType', '');

        // 清除对齐成分
        let topGrid = this.getTopComptByType('GridCompt');
        if (topGrid) topGrid.clearAlignCompts();

        this.updateParentItem('iniType', XmlTags.A_Inv);
      }
      e.stopPropagation();
    },
  },

  watch: {
    iniType: {
      handler(n, o) {
        if (n == XmlTags.A_Inv) {
          this.classType = 'obj-sep-shift';
        } else this.classType = 'obj-sep';
      },
      immediate: true,
    },
  },

  computed: {
    isShift: {
      get: function () {
        return this.iniType == XmlTags.A_Inv;
      },
      cache: false,
    },
  },
};
</script>
