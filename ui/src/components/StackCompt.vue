<template>
  <vue-draggable-resizable ref="dragVue" :class="'s-drag ' + className" :x="x" :y="y"
                           :style="'margin-left:' + marginLeft + 'px;width:auto;height:auto;'"
                           :draggable="editable" :resizable="false" :on-drag-start="onDragStartCallback"
                           @dragging="onDragging" @dragstop="onDragstop" @activated="onActivated"
                           @deactivated="onDeactivated" @mouseup.native="onMouseUp">
    <div class="stack-grid" ref="stackDiv">
      <!-- 顶起虚线 -->
      <component :is="fillDash" class="scdash" :style="dashStyle" :row="1" :column="dashColumn" />
      <!-- 顶起支架 -->
      <component :is="fillLifter" style="align-self:end; margin-bottom: 3px; margin-left: 3px;" :row="1"
                 :column="1" ref="lifter" :parentCompt="this" />
      <!-- 定、状、补垂直线 / 独立语虚线-->
      <div v-if="sepClass != ''" :row="1" :column="stackSepCol" :class="sepClass" @click="foldClick"></div>
      <div v-if="indRClass != ''" :class="indRClass"></div>
      <div v-if="tipContent != ''" class="tip-content">{{ tipContent }}</div>
      <component :is="cornerType" ref="cornerCompt" :row="1" :column="cornerComptCol" :iniType="XmlTags.C_UU"
                 :text="cornerText" :textType="TextType.VIRTUAL_CORNER" :parentCompt="this" :xml="cornerXml">
      </component>
      <div class="stack-compt" ref="stackCompt">
        <component :is="comptTypes[idx]" :key="item.key" v-bind="item" ref="itemRefs"
                   v-for="(item,idx) in items" v-on:compt-loaded="comptLoaded"></component>
      </div>
    </div>

    <!-- <q-tooltip ref="actionTip" :no-parent-event="true" :offset="[0, 0]" transition-show="scale"
                 v-model="showActionTip">
        {{ actionTipContent }}
      </q-tooltip> -->
  </vue-draggable-resizable>
</template>

<script>
// import TextType from "../enum/text_type";
import XmlTags from '../api/xml_tags';
import SubSep from '../enum/sub_sep';
import TextRegion from '../enum/text_region';
import GlobalConst from '../enum/global_variable';

import FillDash from './assist/FillDash.vue';
import FillLifter from './assist/FillLifter.vue';

import BaseCompt from './BaseCompt.vue';
import TextCompt from './TextCompt.vue';
import GridCompt from './GridCompt.vue';

import VueDraggableResizable from 'vue-draggable-resizable/src/components/vue-draggable-resizable.vue';
// import { QTooltip } from 'quasar';

import { ref, getCurrentInstance, nextTick, watch, shallowRef } from 'vue';

export default {
  name: 'StackCompt',
  extends: BaseCompt,
  props: {
    iniItems: {
      type: Array,
      default() {
        return [];
      },
    },
  },

  setup(props, ctx) {
    const { proxy } = getCurrentInstance();

    const adjusting = ref(false); // 是否调整线条中，防止子节点多次调用
    const marginLeft = ref(0); // 左边依存弧空白，只针对主句所在StackCompt
    const comptTypes = shallowRef([]); // 与shallowRef、compsObj一起使用防止报错 Vue received a Component which was made a reactive object
    const items = ref([]);
    const itemRefs = ref([]); // 小句GridCompt
    const cornerCompt = ref();
    const compsObj = shallowRef({
      GridCompt,
    });

    watch(
      () => props.iniItems,
      (newVal, oldVal) => {
        //更新后改变ParentCompt
        if (newVal != null && newVal.length > 0) {
          items.value = newVal;
          for (let i = 0; i < items.value.length; i++) {
            const element = items.value[i];
            // console.log(element.text)
            element.parentCompt = proxy;
          }
        }
      },
      { immediate: true }
    );

    watch(
      items,
      (newVal) => {
        // console.log(newVal)
        comptTypes.value = [];
        for (let i = 0; i < newVal.length; i++) {
          const element = newVal[i];
          if (element != null) {
            comptTypes.value.push(compsObj.value[element.component.name]);
            element.parentCompt = proxy;
          }
        }
      },
      { deep: true, flush: 'sync' }
    );
    //#region 调整线条相关
    watch(marginLeft, (newVal) => {
      // console.log(newVal);
      gridCompts().forEach((o) => {
        nextTick(() => {
          if (o.dependArc != null) o.dependArc.position();
          if (o.line != null) o.line.position();
          o.relDivPosition();
          // setTimeout(() => {
          //   o.lineLoaded = true; // todo 优化lineLoaded的逻辑
          // }, 200);
        });
      });
    });

    // 调整所有线条
    const adjustAllLine = () => {
      gridCompts().forEach((o) => {
        o.position();
        o.arcPosition();
      });
      adjustAllArcPoint();
    };

    // 调整依存弧线条
    const adjustAllArcPoint = () => {
      let maxLeft = proxy.GlobalConst.ArcMarginLeft;
      // 1.依存弧
      gridCompts().forEach((o) => {
        if (o.dependCompt != null && o.dependCompt != o) {
          let left = o.adjustArcGravity();
          if (maxLeft < left) maxLeft = left;
        }
      });
      // 2.左边距
      if (maxLeft != marginLeft.value) {
        marginLeft.value = maxLeft;
      }
      // console.log(maxLeft);
      // 3.根线条
      gridCompts().forEach((o) => {
        if (o.dependCompt == o) {
          o.initialArcStart(maxLeft);
        }
      });
    };

    // 调整对齐线条位置
    const adjustAlignLine = (gc) => {
      let relation = [];
      getAlignedGrid(relation, gc);
      // console.log(relation);
      if (relation.length > 0) delayPosition(20, relation);
    };

    // 清除依赖于gc的句子的线条
    const clearArcLine = (gc) => {
      let array = [];
      getRelationGrid(array, gc, true);
      array.forEach((o) => {
        o.clearLine();
        o.dependCompt = o;
      });
    };

    // 递归延时调整子成分对齐线条
    const delayPosition = (delay, arr, index = 0) => {
      // console.log(arr[index]);
      arr[index].position();
      index++;
      if (index < arr.length)
        setTimeout(function () {
          delayPosition(delay, arr, index);
        }, delay);
    };

    // 从上到下，依次构建依存弧关系（上指向下-20220329）
    const buildDependArc = () => {
      if (proxy.isMainSent) {
        let gcs = gridCompts();
        setTimeout(() => {
          for (let i = 1; i < gcs.length; i++) {
            gcs[i].dependCompt = gcs[i - 1];
          }
          delayArcPosition(100, gcs);
        }, 200);
      }
    };
    // 调整子成分依存弧
    const adjustArcPosition = () => {
      if (!adjusting.value) delayArcPosition(10, gridCompts());
    };
    // 递归延时调整子成分依存弧
    const delayArcPosition = (delay, arr, index = 0) => {
      adjusting.value = true;
      arr[index].arcPosition();
      index++;

      if (index < arr.length) {
        setTimeout(function () {
          delayArcPosition(delay, arr, index);
        }, delay);
      } else {
        adjusting.value = false;
        adjustAllArcPoint();
      }
    };

    const loadArray = ref([]);
    // 判断子GridCompt线条是否全部加载完成
    const loadChildLineCompt = () => {
      // let gcs = gridCompts();
      // gcs.forEach(o => {
      //   console.log(o);
      //   console.log(o.lineComptLoaded);
      // });
      if (loadArray.value.length > 0 && loadArray.value.every((o) => o.lineLoaded)) {
        proxy.delayPosition(100, loadArray.value);
      }
    };
    //#endregion

    // vue3中计算属性无法禁止缓存，改为方法
    const gridCompts = () => {
      let arr = [];
      let children = itemRefs.value;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child && child.belongType && child.belongType(GridCompt)) arr.push(child);
      }
      return arr.sort((a, b) => a.row - b.row);
    };

    // 获取依附于gridCompt的Grid
    const getAlignedGrid = (array, gridCompt, firstLayer = false) => {
      let gcs = gridCompts();
      for (let i = 0; i < gcs.length; i++) {
        const o = gcs[i];
        if (o != gridCompt) {
          let xml = o.toXml();
          if (xml.hasAttribute(XmlTags.A_Indent)) {
            let info = o.parseIndent();
            if (info != null) {
              let row = info.row;
              if (gridCompt.row == row && !array.contains(o)) {
                array.push(o);
                if (firstLayer) return;
                // 递归找出更深层次依赖的Grid
                getAlignedGrid(array, o);
              }
            }
          }
        }
      }
    };

    //#region 收起展开
    const expandAll = async (open) => {
      let gcs = gridCompts();
      for (let i = 0; i < gcs.length; i++) {
        const gc = gcs[i];
        // console.log(gc.toXml().toPlainString());
        if ((open && gc.wholeText != '') || (!open && gc.wholeText == '')) {
          await expandGrid(gc);
        }
      }
    };

    const expandGrid = async (gc) => {
      // console.log(gc);
      let relation = [];
      proxy.getRelationGrid(relation, gc);
      if (gc.wholeText != '') {
        // 段落中，句子展示时添加展开标记
        for (let i = 0; i < relation.length; i++) {
          const re = relation[i];
          re.xml.removeAttribute(XmlTags.A_Expand);
          re.wholeText = '';
          // console.log(re.xml.toPlainString());
          if (re.xml.hasAttribute(XmlTags.A_Auto)) re.autoParse();
          else re.fromXml(false);

          // 延迟图形加载，方便线条对齐（todo 应该等fromXml全部加载完成，且relation符合顺序）
          await nextTick();
        }

        // 调整线条位置    todo 优化合并上面nextTick的逻辑
        if (relation.length > 0) delayPosition(20, relation);
      } else {
        // 收起
        for (let i = 0; i < relation.length; i++) {
          const re = relation[i];
          let xml = re.toXml().cloneNode(true);
          xml.setAttribute(XmlTags.A_Expand, 0);
          xml.setAttribute(XmlTags.A_Id, re.sentId);
          re.wholeText = xml.textContent;
          re.items.length = 0;
          re.dependCompt = re;
          re.updateParentItem('xml', xml);
        }
      }
      // 非句不参与是否展开判断
      if (proxy.diagram) {
        proxy.diagram.linePosition();
        proxy.diagram.isOpen = gridCompts().every((o) => o.wholeText == '' || o.ignore);
      }
    };

    const getRelationGrid = (array, gridCompt, firstLayer = false) => {
      let uRow = -1;
      // 1 先找出自己依赖的Grid
      let gcs = gridCompts();
      let gXml = gridCompt.toXml();
      if (gXml.hasAttribute(XmlTags.A_Indent)) {
        let info = gridCompt.parseIndent();
        if (info != null) uRow = info.row;

        if (uRow != -1) {
          let uGrid = gcs.find((o) => o.row == uRow);
          if (uGrid != null && !array.contains(uGrid)) {
            array.push(uGrid);
            if (firstLayer) return;
            getRelationGrid(array, uGrid);
          }
        }
      }

      // 2 添加自身
      if (!array.contains(gridCompt)) {
        array.push(gridCompt);
        // if (firstLayer) return;
      }

      // 3 找出依赖自己的Grid
      for (let i = 0; i < gcs.length; i++) {
        const o = gcs[i];
        if (o.row != uRow && o != gridCompt) {
          let xml = o.toXml();
          if (xml.hasAttribute(XmlTags.A_Indent)) {
            let info = o.parseIndent();
            if (info != null) {
              let row = info.row;
              if (gridCompt.row == row && !array.contains(o)) {
                array.push(o);
                if (firstLayer) continue;
                // 4 递归找出更深层次依赖的Grid
                getRelationGrid(array, o);
              }
            }
          }
        }
      }
    };
    //#endregion

    const comptLoaded = () => {
      // console.log("grid-comptLoaded");
      if (itemRefs.value.every((o) => o.isLoaded)) {
        // console.log("grid-comptLoaded-all");

        proxy.isLoaded = true;
        itemRefs.value.forEach((o) => (o.isLoaded = false));
        ctx.emit('compt-loaded');
      }
    };

    return {
      ...BaseCompt.setup(props, ctx),

      adjusting,
      comptTypes,
      cornerCompt,
      itemRefs,
      items,
      loadArray,
      marginLeft,

      adjustAlignLine,
      adjustAllArcPoint,
      adjustAllLine,
      adjustArcPosition,
      buildDependArc,
      comptLoaded,
      clearArcLine,
      delayPosition,
      expandAll,
      expandGrid,
      getRelationGrid,
      gridCompts,
      loadChildLineCompt,
    };
  },

  data() {
    return {
      fillDash: null,
      dashColumn: 1,
      dashStyle: '',
      fillLifter: null,
      cornerType: null, //角上文本框
      cornerComptCol: GlobalConst.GridMaxCol,
      cornerText: '',
      cornerXml: null,
      sepClass: '',
      stackSepCol: GlobalConst.GridMaxCol - 1,
      isFold: false, //折叠展开状态，默认展开
      tipContent: '',
      indRClass: '', // 独立语右边空白样式
    };
  },
  methods: {
    onMouseUp(e) {
      // 鼠标右键进行转换（可编辑、非折叠的状、独）
      if (e.button != 2 || !this.editable || this.isFold) return;
      // 状语转独立语
      if (this.belongIniType(XmlTags.C_Zhuang) && this.cornerCompt.text == '') {
        this.updateParentItem('iniType', XmlTags.C_Ind);
        this.sepClass = SubSep.Default[XmlTags.C_Ind];
        this.indRClass = 'ind-right';
        this.cornerType = null;
      }
      // 独立语转状语
      else if (this.belongIniType(XmlTags.C_Ind)) {
        this.updateParentItem('iniType', XmlTags.C_Zhuang);
        this.sepClass = SubSep.Default[XmlTags.C_Zhuang];
        this.cornerType = TextCompt;
        this.$nextTick(() => {
          if (this.cornerCompt && this.cornerCompt.active) {
            this.cornerCompt.active();
          }
        });
      }

      if (e.stopPropagation) e.stopPropagation();
    },

    setCornerXml(xml) {
      this.cornerXml = xml;
      this.$nextTick(() => {
        this.cornerCompt.fromXml();
      });
    },

    textExtract(textRegion, isCut) {
      let text = '';
      let gc = this.gridCompts();
      gc.forEach((o) => (text += o.textExtract(textRegion, isCut)));

      if (this.cornerCompt != null) {
        if (this.belongIniType(this.XmlTags.C_Bu)) text = this.cornerCompt.textExtract(textRegion, isCut) + text;
        else text += this.cornerCompt.textExtract(textRegion, isCut);
      }
      return text;
    },

    textFill(text, textRegion) {
      this.mergeTextFill(text, textRegion);
    },

    mergeTextFill(text, textRegion, target) {
      let gcs = this.gridCompts();
      if (gcs.length > 0) {
        if (textRegion == TextRegion.BEHIND) gcs[gcs.length - 1].mergeTextFill(text, textRegion, target);
        else gcs[0].mergeTextFill(text, textRegion, target);
      }
    },

    toXml(para) {
      // 每个GridCompt和UU放到elems
      let elems = [];
      let cItems = this.childrenItems;
      for (let i = 0; i < cItems.length; i++) {
        const item = cItems[i];
        if (item.belongType && item.belongType(GridCompt)) elems.push(item.toXml(para));
      }
      if (this.cornerType != null && this.cornerCompt != null) {
        let cornerXml = this.cornerCompt.toXml();
        if (cornerXml != null) {
          if (this.iniType == this.XmlTags.C_Bu) elems.unshift(this.cornerCompt.toXml());
          else elems.push(this.cornerCompt.toXml());
        }
      }

      // 包裹elems
      let xmlDoc = new Document();
      let el = xmlDoc.createElement(this.iniType);
      for (let j = 0; j < elems.length; j++) {
        if (elems[j] == null) continue;

        if (elems[j].tagName == this.XmlTags.C_UU) {
          el.appendChild(elems[j]);
          continue;
        }

        // 主句包裹xj节点
        if (this.belongIniType(XmlTags.O_Sent)) {
          el.appendChild(elems[j]);
        } else {
          el.appendArray(elems[j].elements());
        }
      }
      return el;
    },

    fromXml(autoTag) {
      let editor = this.editor;
      let diagramEditable = editor == null ? false : editor.diagramEditable;
      let gcs = this.gridCompts();
      // console.log(gcs);
      if (gcs.length == 0) {
        this.XmlParser.initialItems(this);
        this.$nextTick(() => {
          this.fromXml(autoTag);
          if (diagramEditable) this.editable = true;
          else this.editable = false;
        });
      } else {
        // let indentMap = {};
        let arr = [];
        // 根据依赖的句子放到indentMap排序，如果依赖的句子还有依赖，则递归查找
        for (let i = 0; i < gcs.length; i++) {
          let item = gcs[i];
          if (item.xml.hasAttribute(XmlTags.A_Indent) && !arr.contains(item)) {
            let relation = [];
            this.getRelationGrid(relation, item);

            relation.forEach((o) => {
              if (!arr.contains(o)) arr.push(o);
            });
          }
          // this.$nextTick(() => {
          item.fromXml(autoTag);
          // });
        }

        if (arr.length > 0) {
          this.loadArray = arr;
        }

        if (diagramEditable && this.cornerType != null) {
          this.cornerCompt.active();
          // 空UU不会调用fromXml，需要手动设置isLoaded
          if (this.cornerXml == null && this.cornerCompt) {
            this.cornerCompt.wordUnit.isLoaded = true;
          }
        }
      }
    },

    active() {
      this.editable = true;
      let gcs = this.gridCompts();
      for (let i = 0; i < gcs.length; i++) {
        let item = gcs[i];
        item.active();
      }
      if (this.cornerCompt && this.cornerCompt.active) {
        this.cornerCompt.active();
      }
    },

    deActive(hideCode, hideTb) {
      this.editable = false;
      let gcs = this.gridCompts();
      for (let i = 0; i < gcs.length; i++) {
        let item = gcs[i];
        item.deActive(hideCode, hideTb);
      }
      if (this.cornerCompt != null) this.cornerCompt.deActive(hideCode, hideTb);
    },
  },

  mounted() {
    // console.log('stack-mout')
    if (
      this.iniType == this.XmlTags.C_Zhu ||
      this.iniType == this.XmlTags.C_Wei ||
      this.iniType == this.XmlTags.C_Bin
    ) {
      this.fillDash = FillDash;
      this.fillLifter = FillLifter;
      this.$refs.stackCompt.style.marginLeft = '3px';
      this.$el.style.alignSelf = 'end';
    } else if (this.iniType == this.XmlTags.C_Ding || this.iniType == this.XmlTags.C_Zhuang) {
      this.sepClass = SubSep.Default[this.iniType];
      this.cornerType = TextCompt;
    } else if (this.iniType == this.XmlTags.C_Bu) {
      this.sepClass = SubSep.Default[this.iniType];
      this.cornerComptCol = 1;
      this.stackSepCol = 2;
      this.cornerType = TextCompt;
    } else if (this.iniType == this.XmlTags.C_Ind) {
      this.sepClass = SubSep.Default[this.iniType];
      this.indRClass = 'ind-right';
    } else if (!this.isMainSent) this.fillDash = FillDash;
  },

  updated() {
    // console.log('stack-update')
  },

  computed: {
    childrenItems: {
      get: function () {
        let arr = this.itemRefs
          .filter((o) => o.belongType)
          .slice(0)
          .sort((a, b) => a.row - b.row);
        if (arr.length > 0 && this.cornerType && this.cornerCompt) {
          if (this.belongIniType(XmlTags.C_Bu)) arr.unshift(this.cornerCompt);
          else arr.push(this.cornerCompt);
        }
        return arr;
      },
      cache: false,
    },

    lifter: function () {
      return this.$refs.lifter;
    },

    layoutDiv: function () {
      return this.$refs.stackDiv;
    },
  },

  components: {
    FillDash,
    FillLifter,
    VueDraggableResizable,
    // QTooltip,
  },
};
</script>