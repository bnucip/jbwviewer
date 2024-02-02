<template>
  <div :class="classType" :style="gridStyle" @mouseup="onMouseUp"></div>
</template>

<script>
import GridUtil from '../../api/grid_util';
import XmlTags from '../../api/xml_tags';
import UIElement from '../UIElement.vue';

export default {
  name: 'SbjSep',
  extends: UIElement,
  props: {},
  setup(props, ctx) {
    return { ...UIElement.setup(props, ctx) };
  },
  data() {
    return {
      classType: 'sbj-sep',
    };
  },
  methods: {
    onMouseUp: function (e) {
      // 鼠标右键
      if (e.button != 2 || !this.editable) return;
      if (this.iniType == XmlTags.A_Inv) this.updateParentItem('iniType', '');
      else {
        // 约束：1、成分复句中不能有倒装    2、主谓倒装前不能有状、独、连词
        if (
          (this.parentCompt.isInStack && !this.parentCompt.isMainSent) ||
          GridUtil.findElemsByCol(this.parentCompt, 1, this.column, 'BaseCompt').some((o) =>
            o.belongIniType(XmlTags.C_Zhuang, XmlTags.C_Ind, XmlTags.C_CC)
          )
        )
          return;

        // 约束：同一主干线，主、宾倒装只能存在一个
        GridUtil.findElemsByCol(this.parentCompt, null, null, 'ObjSep')
          .filter((o) => o.isShift)
          .forEach((o) => o.updateParentItem('iniType', ''));

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
          this.classType = 'sbj-sep-shift';
        } else this.classType = 'sbj-sep';
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
