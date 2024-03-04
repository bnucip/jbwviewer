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

<style lang="scss" scoped>
// region PrdSep
.syn,
.SYN,
.syn-l,
.SYN-l {
  height: 60px;
  width: 8px;
  position: relative;
  align-self: end;
  margin: 0px 8px 0px 2px;
}

.syn::after,
.SYN::after,
.syn-l::after,
.SYN-l::after {
  content: ':';
  font-size: 40px;
  font-family: 'Times New Roman', Times, serif;
  font-weight: bold;
  position: absolute;
  bottom: 8px;
}

.ser,
.SER,
.ser-l,
.SER-l,
.pvt,
.PVT,
.pvt-l,
.PVT-l {
  height: 60px;
  width: 20px;
  position: relative;
  align-self: end;
  margin: 0px 5px 0px 2px;
}

.ser::after,
.SER::after,
.ser-l::after,
.SER-l::after {
  content: '';
  width: 3px;
  height: 100%;
  position: absolute;
  left: 10px;
  transform: skewX(-13deg);
  background: #000;
}

.pvt::before,
.PVT::before,
.pvt-l::before,
.PVT-l::before {
  content: '';
  width: 3px;
  height: 100%;
  position: absolute;
  left: 8px;
  transform: skewX(-13deg);
  background: #000;
}

.pvt::after,
.PVT::after,
.pvt-l::after,
.PVT-l::after {
  content: '';
  width: 3px;
  height: 100%;
  position: absolute;
  left: 14px;
  transform: skewX(-13deg);
  background: #000;
}

.uni,
.UNI,
.uni-l,
.UNI-l {
  height: 30px;
  width: 20px;
  position: relative;
  align-self: end;
  justify-self: center;
}

.uni::after,
.UNI::after {
  content: '';
  height: 4px;
  width: 20px;
  position: absolute;
  top: 13px;
  left: 1px;
  background: linear-gradient(to right, black 0, black 5.1px, transparent 5.1px, transparent 6.8px);
  background-size: 7px 4px;
}

.uni-l::after,
.UNI-l::after {
  content: '';
  height: 4px;
  width: 40px;
  position: absolute;
  top: 13px;
  margin-left: -10px;
  background: linear-gradient(to right, black 0, black 5.1px, transparent 5.1px, transparent 6.8px);
  background-size: 7px 4px;
}
// endregion
</style>