<template>
  <div :style="gridStyle"></div>
</template>

<script>
import XmlTags from '../api/xml_tags';
import { ref } from 'vue';

export default {
  name: 'UIElement',
  props: {
    parentCompt: Object,
    column: Number,
    row: Number,
    iniType: String,
  },

  setup() {
    const itemRefs = ref([]);
    const editable = ref(false); // 是否可编辑、可转换、可点击

    return { itemRefs, editable };
  },

  computed: {
    gridStyle: function () {
      let style = '';
      if (this.row != undefined) style += 'grid-row: ' + this.row + ';';
      if (this.column != undefined) style += 'grid-column: ' + this.column + ';';
      // let style = {};
      // if (this.row != undefined) style['grid-row'] = this.row;
      // if (this.column != undefined) style['grid-column'] = this.column;
      return style;
    },
  },
  mounted() {
    // console.log('UIElement mounted')
    // let domElement = this.$el;
    // console.log(domElement)
  },
  methods: {
    updateParentItem(name, value) {
      if (this.$parent != null && this.$parent.belongType('Diagram')) {
        // console.log(this.$parent);
        if (name == 'xml') this.$parent.xml = value;
        return;
      }

      if (this.parentCompt == null || this.parentCompt.items == null || !Array.isArray(this.parentCompt.items)) return;

      let pCompt = this.parentCompt;
      // StackCompt里面暂时只处理text和marginLeft
      if (pCompt.belongType('StackCompt')) {
        if (this.belongIniType(XmlTags.C_UU) && name == 'text') {
          pCompt.cornerText = value;
        } else if (name == 'marginLeft') {
          pCompt.marginLeft = value;
        } else {
          let pItem = pCompt.items.find(
            (o) => o.row == this.row && o.component != null && this.belongType(o.component)
          );
          if (pItem != null && Object.hasOwnProperty.call(pItem, name)) {
            pItem[name] = value;
          }
        }
      }
      // GridCompt
      else if (pCompt.belongType('GridCompt')) {
        let pItem = pCompt.items.find(
          (o) => o.column == this.column && o.component != null && this.belongType(o.component)
        );
        if (pItem != null && Object.hasOwnProperty.call(pItem, name)) {
          pItem[name] = value;
        }
      }
    },

    active() {
      this.editable = true;
    },
    deActive() {
      this.editable = false;
    },
  },
};
</script>
