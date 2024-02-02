<template>
  <vue-draggable-resizable ref="dragVue" :class="'t-drag ' + className" w="auto" h="auto" :x="x" :y="y" :z="z"
                           :draggable="canDrag" :style="dragStyle + gridStyle" :onDrag="onDragCallback"
                           @dragging="onDragging" @dragstop="onDragstop" @activated="onActivated"
                           @deactivated="onDeactivated" @mouseup.native="onMouseUp">
    <div class="textcompt" :style="'cursor:default;' + comptStyle">
      <div v-if="lexInfo != null">
        <span>{{ gouciType }}</span>
        <span style="font-size:8px;color:grey;cursor:help;">
          {{ lexInfo }}
          <!-- <q-tooltip anchor="top middle" self="bottom middle" transition-show="scale" max-width="300px">
            {{ lexShiyi }}
          </q-tooltip> -->
        </span>
      </div>
      <word-unit :text="text" ref="wordUnit" v-on:wu-loaded="wordUnitLoaded" />
    </div>
    <!-- <q-tooltip ref="actionTip" :no-parent-event="true" :offset="[0, 0]" transition-show="scale"
                 v-model="showActionTip">
        {{ actionTipContent }}
      </q-tooltip> -->
  </vue-draggable-resizable>
</template>

<script>
import XmlTags from '../api/xml_tags.js';
import TextType from '../enum/text_type';
import TextRegion from '../enum/text_region';
import BaseCompt from './BaseCompt.vue';
import WordUnit from './WordUnit.vue';

import VueDraggableResizable from 'vue-draggable-resizable/src/components/vue-draggable-resizable.vue';
// import { QTooltip } from 'quasar';

import { ref, getCurrentInstance, computed, onMounted } from 'vue';

export default {
  name: 'TextCompt',
  extends: BaseCompt,
  props: {
    draggable: {
      type: Boolean,
      default: true,
    },
    textType: Number, //soild  virtual  virtual-corner
    wId: Number, // 词语条目id
    gType: Number, // 构词类型
    lexInfo: String, // 词法信息
    lexShiyi: String, // 释义
  },

  setup(props, ctx) {
    const { proxy } = getCurrentInstance();

    const gouciType = ref(props.gType);
    const wordUnit = ref();

    onMounted(() => {
      proxy.adjustCompt();
    });

    const onDragCallback = (x, y) => {
      // console.log('x:' + x + ',y:' + y);

      // todo 无法把VueDraggableResizable控件外移，所以要杂糅弹出编辑圈都判断，后续可优化相关逻辑
      let words = wordUnit.value.words;
      let distance = Math.pow(proxy.x, 2) + Math.pow(proxy.y, 2);
      // console.log(words, document.activeElement, proxy.diagram.activeElement, distance);
      //焦点在文本框内，非虚词位
      if (
        words != null &&
        (document.activeElement == words || (proxy.diagram && proxy.diagram.activeElement == words)) &&
        !XmlTags.C_No_Split.contains(props.iniType) &&
        (wordUnit.value.isTouching || (distance > 0 && distance < 300))
      ) {
        proxy.acDragging(null, true);
        proxy.diagram.activeElement = words;
        words.blur();
        return false;
      }
      // return false //会阻止继续拖动
    };

    const wordUnitLoaded = () => {
      // console.log("wordUnitLoaded");
      wordUnit.value.isLoaded = false;
      proxy.isLoaded = true;
      ctx.emit('compt-loaded');
    };

    return { ...BaseCompt.setup(props, ctx), gouciType, wordUnit, onDragCallback, wordUnitLoaded };
  },

  data() {
    return {
      dragStyle: '',
      comptStyle: '',
    };
  },
  methods: {
    onMouseUp(e) {
      this.onActivated();
      // console.log(e);
      let wu = this.wordUnit;
      if (wu == null) return;
      let editor = this.getEditor();
      if (wu.activeType == null || wu.getRange() == null) {
        if (editor != null && this.editable) {
          wu.activeType = wu.typeBlocks[0];
          let textTrim = wu.activeType.text.trim();
          editor.focusedWordUnit = wu;
          editor.wordInfo.queryWord(textTrim, wu.activeType.code);
        }
      }

      // 右键成分转换
      if (e != null && e.button == 2) {
        if (!this.editable) return;

        let pCompt = this.parentCompt;
        if (pCompt == null) return;

        pCompt.changeTcType(this.column, this.iniType);
        e.stopPropagation();
      }
    },

    // 调整成分位置、样式等
    adjustCompt() {
      if (this.textType != undefined) {
        // console.log(this.textType)
        // console.log(this.iniType)

        if (this.textType == TextType.VIRTUAL_CORNER) {
          let dsm = '',
            ds = '',
            cs = '',
            das = '';
          if (this.parentCompt.iniType == 'att') dsm = 'margin: 6px 1px 0px 14px;';
          else if (this.parentCompt.iniType == 'adv') dsm = 'margin: 6px 1px 0px 3px;';
          else if (this.parentCompt.iniType == 'cmp') dsm = 'margin: 6px 3px 0px 1px;';
          else dsm = 'margin: 0px 3px;';

          cs = 'padding: 0px;';
          ds = 'padding: 0px; border-width: 0px;';
          das = 'align-self:start;';
          this.editable = false;

          this.dragStyle = ds + dsm + das;
          this.comptStyle = cs;
        }

        if (this.textType != TextType.SOLID) {
          this.wordUnit.setWordMinWidth('0px');
        }
      }

      let iniType = this.iniType;
      if (iniType == XmlTags.V_Fun_COO1 || iniType == XmlTags.V_Fun_UNI1) {
        this.dragStyle = 'align-self:start;';
        this.comptStyle = 'padding: 19px 8px 5px 8px;';
      } else if (iniType == XmlTags.V_Fun_APP || iniType == XmlTags.V_Fun_COO) {
        this.dragStyle = 'border-width: 0px; background-color: white;';
        this.comptStyle = 'padding: 0px 8px 7px 8px;';
        this.editable = false;
      } else if (iniType == XmlTags.V_Fun_UNI) {
        this.dragStyle = 'padding: 0px; border-width: 0px; margin: 0px 8px 18px 9px;';
        this.comptStyle = 'padding: 0px;';
        this.editable = false;

        this.wordUnit.setWordMinWidth('0px');
      }

      if (this.editor != null && this.editor.belongType('LexiconEdit')) this.dragStyle = 'align-self:start;';
    },

    textExtract(textRegion, isCut) {
      return this.wordUnit == null ? '' : this.wordUnit.textExtract(textRegion, isCut);
    },

    textFill(text, textRegion) {
      if (this.wordUnit == null) return;
      this.wordUnit.textFill(text, textRegion);
    },

    mergeTextFill(text, textRegion) {
      if (this.wordUnit == null) return;
      // 合并时去除原先空格，把所有本文合到一起重新分析
      let xml = this.toXml();
      let thisText = xml == null ? '' : xml.textContent;
      if (textRegion == TextRegion.BEHIND) thisText += text;
      else thisText = text + thisText;

      this.wordUnit.wordTypeMap = {}; //需清空历史，否则动态词自动切分时，可能会有问题
      this.wordUnit.textFill(thisText, TextRegion.ALL);
    },

    toXml() {
      let tagName,
        attr = '',
        iniType = this.iniType;
      if (
        iniType == undefined ||
        iniType == XmlTags.C_Ding ||
        iniType == XmlTags.C_Zhuang ||
        iniType == XmlTags.C_Bu ||
        iniType == XmlTags.C_Ind
      )
        tagName = this.XmlTags.O_Temp;
      else {
        if (XmlTags.CC_Text_Fun.contains(iniType)) {
          attr = iniType;
          tagName = XmlTags.C_CC;
        } else tagName = iniType;
      }

      if (this.wordUnit == null) return null;
      let wuElems = this.wordUnit.toXml();
      if ((wuElems == null || wuElems.length == 0) && iniType == XmlTags.C_UU) return null;

      let xmlDoc = new Document();
      let elem = xmlDoc.createElement(tagName);
      if (attr != '') elem.setAttribute(XmlTags.A_Fun, attr);
      for (let i = 0; i < wuElems.length; i++) {
        const wu = wuElems[i];
        elem.appendChild(wu);
      }
      return elem;
    },

    fromXml(autoTag) {
      // console.log(this.xml);
      if (this.xml != null) {
        this.$nextTick(() => {
          this.wordUnit.fromXml(this.xml.elements(), autoTag);
        });
      }
    },

    active() {
      this.editable = true;
      if (this.wordUnit != null) this.wordUnit.active();
    },

    deActive(hideCode, hideTb) {
      this.editable = false;
      if (this.wordUnit != null) this.wordUnit.deActive(hideCode, hideTb);
    },
  },

  updated() {
    // console.log('updated' + this.text)
    this.adjustCompt();
  },

  computed: {
    wuText: {
      get() {
        return this.$refs.wordUnit.words.innerText;
      },
      cache: false,
    },

    canDrag: function () {
      return this.editable && this.draggable;
    },
  },

  watch: {},
  components: {
    WordUnit,
    VueDraggableResizable,
    // QTooltip,
  },
};
</script>
