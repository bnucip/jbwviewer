<template>
  <div @mouseup="onMouseUp" @touchend.stop="changePrdType" :style="'grid-row:1;' + gridStyle"
       :class="classType">
  </div>
</template>

<script>
import XmlTags from '../../api/xml_tags';
import UIElement from '../UIElement.vue';

// const LoArray = require('lodash/array');

// import Lodash from 'lodash';
import LoArray from 'lodash/array';

export default {
  name: 'PrdSep',
  extends: UIElement,
  props: {},
  setup(props, ctx) {
    return { ...UIElement.setup(props, ctx) };
  },
  data() {
    return {
      classType2: '',
      prdType: this.iniType == null ? '' : this.iniType.toUpperCase(),
    };
  },
  mounted() {},
  methods: {
    onMouseUp: function (e) {
      // 鼠标右键
      if (e.button != 2) return;
      this.changePrdType();
      e.stopPropagation();
    },

    changePrdType(e) {
      if (!this.editable) return;
      if (this.prdType == undefined) this.prdType = this.iniType;
      // console.log(this.prdType);

      // 谓语转换：合成→连动，连动→兼语→联合→连动
      switch (this.prdType) {
        case XmlTags.V_Fun_PVT:
          this.parentCompt.addUniTc(this.column);
          this.prdType = XmlTags.V_Fun_UNI;
          break;
        case XmlTags.V_Fun_UNI:
          // 限制：文本框需为空
          let tc = this.parentCompt.childrenItems.find((o) => o.column == this.column && o.belongType('TextCompt'));
          if (tc == null || tc.text != '') return;
          let rights = LoArray.takeWhile(this.rightCompts(), (p) => !p.belongIniType(XmlTags.C_Wei));
          if (rights.some((o) => o.belongIniType(XmlTags.C_Zhu))) return;

          if (!this.parentCompt.removeUniTc(this.column)) return;
          this.prdType = XmlTags.V_Fun_SER;
          break;
        case XmlTags.V_Fun_SER:
          this.prdType = XmlTags.V_Fun_PVT;
          break;
        case XmlTags.V_Fun_SYN:
          // 限制：左边需为谓语
          let left = this.nearestLeftCompt();
          if (left.iniType != XmlTags.C_Wei) return;
          if (left.isInMainLine) this.parentCompt.addObjTc(this.column);
          this.prdType = XmlTags.V_Fun_SER;
          break;
      }
      this.updateParentItem('iniType', this.prdType);
    },

    toXml: function () {
      let xmlDoc = new Document();
      let elem = xmlDoc.createElement(XmlTags.C_CC);
      let type = this.prdType == undefined ? this.iniType : this.prdType;
      elem.setAttribute(XmlTags.A_Fun, type.toUpperCase());
      return elem;
    },
  },
  watch: {
    // prdType (newVal, oldVal) {
    //   console.log(newVal)
    //   console.log(oldVal)
    // }
  },
  computed: {
    classType: function () {
      return (this.prdType == undefined ? this.iniType : this.prdType) + this.classType2;
    },
  },
  components: {},
};
</script>
