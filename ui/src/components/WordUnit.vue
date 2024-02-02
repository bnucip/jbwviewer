<template>
  <div class="word-unit non-selectable">
    <div class="word-box" style="cursor:text;" v-text="innerText" :contenteditable="editable" ref="words"
         @input="inputWord" @mouseup="onMouseUp" @keyup="onKeyUp" @keydown="onKeyDown" @focus="onFocus"
         @blur="onBlur" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    </div>
    <!-- <q-input
      class="word-box"
      outlined
      square
      dense
      v-model="innerText"
      ref="words"
      @mouseup="onMouseUp"
      @keyup="onKeyUp"
      @keydown="onKeyDown"
      @focus="onFocus"
      @blur="onBlur"
    ></q-input> -->
    <div class="word-type" v-show="showTotal">
      <span :style="'color:'+ dpColor">{{ dynamicPos }}</span>
      <span ref="colon">:</span>
    </div>
    <div class="types-grid">
      <type-block :key="index" v-bind="item" v-for="(item, index) in typeBlocks" />
    </div>
  </div>
</template>

<script>
// const LoFn = require("lodash/function");

import PrdExtend from '../enum/prd_extend';
import XmlTags from '../api/xml_tags.js';
import DataTags from '../enum/data_tags';
import ExprTags from '../api/expr_tags';
import DictType from '../enum/dict_type';
import TextRegion from '../enum/text_region';
import TextType from '../enum/text_type';

import TypeBlock from './TypeBlock.vue';
import PrdSep from './assist/PrdSep.vue';

import Common from '../api/common';
import GridUtil from '../api/grid_util';
import { XMLParser } from 'fast-xml-parser';
import { ref, getCurrentInstance, computed, nextTick, watch } from 'vue';

const parser = new XMLParser();
// 详细说明见https://github.com/NaturalIntelligence/fast-xml-parser#note-he-library-is-used-in-this-example
const options = {
  attributeNamePrefix: '_', //属性前缀，默认为@_
  ignoreAttributes: false, //是否忽略解析属性
  parseAttributeValue: true, //为true时，属性值优先按数字和布尔解析，否则按字符
  parseNodeValue: false, //为true时，节点值优先按数字和布尔解析，否则按字符
  trimValues: true,
  arrayMode: true,
  stopNodes: ['mode'], //不需要继续解析的节点，节点值按字符串处理
};

export default {
  components: { TypeBlock },
  name: 'WordUnit',
  props: {
    text: String, //words内容变换时，需要同步更新此值，由此触发updateGrid
  },

  setup(props, ctx) {
    const { proxy } = getCurrentInstance();

    const wordTypeMap = ref({}); //以词为key，记录已标信息
    const activeType = ref(null);

    const words = ref(); // 文本输入框对应div
    const dynamicPos = ref(''); // 动态词总体词性
    watch(dynamicPos, (newVal) => {
      nextTick(() => {
        if (newVal != XmlTags.W_QueSheng) dpColor.value = 'black;';
        else dpColor.value = 'red;';
      });
    });
    const dpColor = ref(); // 动态词总体词性颜色
    // 空格分隔开词语信息（词性、义码、模式）
    const typeBlocks = ref([
      {
        pos: '',
      },
    ]);
    watch(
      typeBlocks,
      (newVal) => {
        // console.log(newVal.length);
        if (proxy.checkDynamicWord) {
          proxy.checkDynamicWord();
        }
      },
      { deep: true }
    );

    const editor = computed(() => {
      return proxy.getEditor();
    });
    // 父级TextCompt
    const parentCompt = computed(() => {
      return proxy.ancestor('TextCompt');
    });

    // 根据成分，获取成分对应的优先词类
    const defaultPos = (pos) => {
      let iniType = parentCompt.value.belongIniType(XmlTags.O_Temp)
        ? parentCompt.value.parentCompt.iniType
        : parentCompt.value.iniType;

      // d在prd或att中时默认转a
      var dp =
        pos == XmlTags.W_Fu && (iniType == XmlTags.C_Ding || iniType == XmlTags.C_Wei)
          ? XmlTags.W_XingRong
          : XmlTags.defaultPos(iniType);

      return dp;
    };
    // 根据成分，获取成分对应的词类数组
    const comptPosList = () => {
      let pCompt = parentCompt.value;

      // 词法标注时返回全部
      if (pCompt.belongIniType(XmlTags.O_Generic)) return XmlTags.W_All;

      // 非主宾位置NP纯并列（无ATT、APP、PP、FF等）时，词法标注时返回全部
      let npCompts = [...pCompt.leftNpCompts(), ...pCompt.rightNpCompts()];
      if (
        npCompts.length > 0 &&
        pCompt.parentCompt &&
        !pCompt.parentCompt.belongIniType(XmlTags.O_Sent) &&
        npCompts.every((o) => o.belongIniType(XmlTags.C_Bin, XmlTags.V_Fun_COO))
      ) {
        return XmlTags.W_All;
      }

      // 助动词限制为动词
      if (pCompt.belongIniType(XmlTags.C_Wei) && pCompt.prdExtend() == PrdExtend.SYN)
        return [XmlTags.W_Dong, XmlTags.W_QueSheng, XmlTags.W_BiaoDian];

      // 独词句返回全部，不限制词性
      if (
        pCompt.isOnlySbj &&
        pCompt.parentCompt.childrenItems.every((o) => o.belongIniType(XmlTags.C_Zhu, XmlTags.C_UN, XmlTags.C_CC))
      )
        return XmlTags.W_All;

      // 右侧UN时，不限制词性     红色的、其实呢
      let nr = pCompt.nearestRightCompt();
      if (pCompt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin) && nr != null && nr.belongIniType(XmlTags.C_UN)) {
        return XmlTags.W_All;
      }

      // 左侧UN时，不限制词性     所XX
      let nl = pCompt.nearestLeftCompt();
      if (pCompt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin) && nl != null && nl.belongIniType(XmlTags.C_UN)) {
        return XmlTags.W_All;
      }

      let iniType = pCompt.belongIniType(XmlTags.O_Temp) ? pCompt.parentCompt.iniType : pCompt.iniType;
      // return XmlTags.W_All;
      return XmlTags.comptPosList(iniType).concat(XmlTags.W_QueSheng, XmlTags.W_BiaoDian);
    };

    const updateTypeBlock = (pos) => {
      // console.log("updateTypeBlock");
      if (words.value == null || words.value.innerText == '') return;

      let tb = typeBlocks.value.find((o) => o.pos != XmlTags.W_BiaoDian);
      // C1 单个词性
      if (dynamicPos.value == '' && tb != null) {
        let wordInfo = editor.value != null && editor.value.wordInfo != null ? editor.value.wordInfo.activeItem : null;
        // 指定词性逻辑：当前成分包含该词性且对应义项包含该词性
        if (pos != null && wordInfo != null && comptPosList().contains(pos) && wordInfo.pos.indexOf(pos) > -1)
          tb.pos = pos;
        // 默认词性逻辑：当前成分不包含当前词性则取默认词性
        else if (!comptPosList().contains(tb.pos)) tb.pos = defaultPos();
      }
      // C2 总体词性
      else if (dynamicPos.value != '' && !comptPosList().contains(dynamicPos.value)) {
        dynamicPos.value = defaultPos();
      }
    };

    // 标注词法模式
    const markModType = (mode) => {
      let modeType = proxy.getModFirstType();
      if (modeType != null) {
        let text = modeType.text.trim();
        modeType.mod = mode;
        wordTypeMap.value[text].mod = mode;
        proxy.updatePosByMod();
        if (proxy.moveToNext(1) && activeType.value != modeType) {
          proxy.setWordInfo(activeType.value.text.trim(), activeType.value.code);
        }
      }
      // 词语中间
      else if (activeType.value != null) {
        let innerText = words.value.innerText;
        let reg = new RegExp(proxy.GlobalConst.PunctuationRegex + '|\\s', 'g');
        // 双字词，无视光标位置
        let leftText = innerText.replace(reg, '');
        if (leftText.length == 2) {
          let modTb = typeBlocks.value.find(
            (o) => o.mod != null && o.mod != '' && (o.mod != ' ' || o.pos != XmlTags.W_BiaoDian)
          );
          if (modTb && typeBlocks.value.filter((o) => o.pos != XmlTags.W_BiaoDian).length == 2) {
            modTb.mod = mode;
          } else {
            let idx = typeBlocks.value.findIndex((o) => /[\u4e00-\u9fa5]/.test(o.text));
            let xmlDoc = new Document();
            let dWord = xmlDoc.createElement(XmlTags.W_QueSheng);
            let x1 = xmlDoc.createElementNew(XmlTags.W_QueSheng, leftText[0]);
            let x2 = xmlDoc.createElementNew(XmlTags.W_QueSheng, leftText[1]);
            dWord.setAttribute(XmlTags.A_Mod, XmlTags.W_QueSheng + mode + XmlTags.W_QueSheng);
            dWord.append(x1, x2);
            proxy.markDynamicWord(dWord, idx, true);
          }
        }
        // 其他
        else {
          let pos = proxy.getCaretPosition();
          let temp = 0;
          let textPos = 0; // 当前光标在TypeBlock的text中位置
          if (pos > 0 && pos < words.value.innerText.length) {
            for (let i = 0; i < typeBlocks.value.length; i++) {
              const tb = typeBlocks.value[i];
              if (tb == activeType.value) {
                textPos = pos - temp;
                break;
              }
              temp += tb.text.length;
            }
          }

          let text = activeType.value.text.trim();
          let t1 = text.substring(0, textPos);
          let t2 = text.substring(textPos);
          let puncReg = new RegExp('^' + proxy.GlobalConst.PunctuationRegex + '+$');
          // 模拟动态词标注，左右两部分都不能是标点
          if (textPos > 0 && textPos < text.length && !puncReg.test(t1) && !puncReg.test(t2)) {
            let xmlDoc = new Document();
            let dWord = xmlDoc.createElement(XmlTags.W_QueSheng);
            let x1 = xmlDoc.createElementNew(XmlTags.W_QueSheng, t1);
            let x2 = xmlDoc.createElementNew(XmlTags.W_QueSheng, t2);
            dWord.setAttribute(XmlTags.A_Mod, XmlTags.W_QueSheng + mode + XmlTags.W_QueSheng);
            dWord.append(x1, x2);
            proxy.markDynamicWord(dWord, null, true);
          }
        }
      }
    };

    return {
      wordTypeMap,
      activeType,
      words,
      typeBlocks,
      dpColor,
      dynamicPos,
      editor,
      parentCompt,
      defaultPos,
      comptPosList,
      updateTypeBlock,
      markModType,
    };
  },

  data() {
    return {
      width: 40,
      innerText: this.text, //只做初始化用，直接赋值会使光标重置，并且打断输入法
      isFocused: false,
      showTotal: false,
      editable: false,

      isTouching: false,
      isLoaded: false,

      oldTbs: [], //记录历史typeBlocks
      oldText: '', //记录上一次本文，动态词自动切分一次后就不再切分

      //保存焦点丢失前的选择范围
      lastRange: {
        startOffset: 0, //选择范围开始位置，不受从左到右或从右到左影响
        endOffset: 0, //选择范围结束位置，不受从左到右或从右到左影响
        anchorOffset: 0, //光标开始位置，受从左到右或从右到左影响
        focusOffset: 0, //光标结束位置，受从左到右或从右到左影响

        startContainer: {
          textContent: '',
        },
      },

      queryQueue: [], // 请求querySentOrWord接口的参数队列，优化请求次数，需要在floatShortcut中remove
    };
  },

  created() {
    // 防抖优化-延时执行，减少请求服务器
    // this.debouncedInput = LoFn.debounce(this.inputWord, 200);
    // this.debouncedKeyUp = LoFn.debounce(this.onKeyUp, 200);
    // this.debouncedKeyDown = LoFn.debounce(this.onKeyDown, 200);
  },
  mounted() {
    let _this = this;
    //添加粘贴监听，去除样式标记
    this.words.addEventListener('paste', function (e) {
      e.preventDefault();
      let editor = _this.getEditor();
      if (editor == null || editor.actionToolbar == null) return;
      let keyEvent = editor.actionToolbar.keyEvent;
      // Ctrl+Shift+Vshi时，走成分复制，不进行原有粘贴逻辑
      if (keyEvent != null && keyEvent.ctrlKey && keyEvent.shiftKey && keyEvent.key == 'V') return;

      var text;
      var clp = (e.originalEvent || e).clipboardData;
      // console.log(456);
      if (clp === undefined || clp === null) {
        text = window.clipboardData.getData('text') || '';
        if (text !== '') {
          if (window.getSelection) {
            var newNode = document.createElement('span');
            newNode.innerHTML = text;
            window.getSelection().getRangeAt(0).insertNode(newNode);
          } else {
            document.selection.createRange().pasteHTML(text);
          }
        }
      } else {
        text = clp.getData('text/plain') || '';
        //去除其中换行标记
        if (text !== '') {
          document.execCommand('insertText', false, text.replace(/\r\n/g, ' '));
        }
      }
    });

    this.updateGrid(this.text);
    this.markTypeBlocks();
    // this.adjustInputWidth();
  },
  updated() {
    // this.adjustInputWidth();
  },

  methods: {
    onTouchStart(e) {
      let touch = e.changedTouches[0];
      let clientX = touch.clientX;
      let p = this.parentCompt.getPosition(this.words);
      if (p == null) {
        this.setWordsCaret(this.words, 0);
        return;
      }

      // 计算光标在文本中的位置caret
      let x = clientX - p.x;
      let caret = 0;
      if (x > 13) {
        // console.log(x);
        let len = this.words.innerText.length;
        let temp = 5; //初始padding=5 单字符占位13 双字符占位21
        for (let i = 0; i < len; i++) {
          const char = this.words.innerText[i];
          let charCode = char.charCodeAt(0).toString(16);
          let cur = i == len - 1 ? 13 : 9;
          if (char == ' ') temp += 8;
          else if (charCode.length == 2) temp += 13;
          else temp += 21;

          let next = 11;
          if (i + 1 < len) {
            let nextChar = this.words.innerText[i + 1];
            let nextCode = nextChar.charCodeAt(0).toString(16);
            if (nextChar == ' ') next = 5;
            else if (nextCode.length == 2) next = 7;
          }
          // console.log("x:" + x + "\ttemp:" + temp + "\tcur:" + cur + "\tnext:" + next);
          if ((temp >= x && temp - x <= cur) || (x > temp && x - temp <= next)) {
            caret = i + 1;
            break;
          }
        }

        // 点击本文框右边默认空白时
        if (caret == 0 && temp > 5 && x - temp > 11) caret = len;
      }
      // console.log(caret);
      // e.preventDefault(); //会阻止后续事件，导致onActivated、onDeactivated等失效
      this.onFocus();
      this.setWordsCaret(this.words, caret);
      this.isTouching = true;
      this.editor.activeElement = this.words;
      if (document.activeElement) document.activeElement.blur();
      // this.words.blur();
    },
    onTouchMove(e) {
      this.editor.vchart.highLight(e);
    },
    onTouchEnd(e) {
      this.editor.vchart.onTouchEnd(e);
      this.isTouching = false;
    },

    inputWord(e) {
      // console.log(e);
      let text = e.target.innerText.trim();
      //屏蔽首尾空格
      if (text != e.target.innerText) {
        e.target.innerText = text;
        // return;
      }
      // 复制粘贴时，连续俩个以上空格，需要特殊处理，否则e.target.innerText和e.target.innerHTML不一致
      if (/\s\s/.test(e.target.innerHTML)) {
        e.target.innerHTML = e.target.innerHTML.replace(/\s/g, '&nbsp;');
      }

      this.setUpperText(text);
      this.updateGrid(text);
      this.markTypeBlocks();
      this.updateTypeBlock();

      let tbs = this.typeBlocks;
      for (let key in this.wordTypeMap) {
        if (!tbs.some((o) => o.text.trim() == key)) {
          delete this.wordTypeMap[key];
        }
      }
      for (let i = 0; i < tbs.length; i++) {
        const tb = tbs[i];
        let tbText = tb.text.trim();
        if (tbText != '' && !this.wordTypeMap.hasOwnProperty(tbText)) {
          this.wordTypeMap[tbText] = { pos: tb.pos, code: tb.code, mod: tb.mod };
        }
      }
    },

    //渲染调整input宽度会造成性能问题
    adjustInputWidth(w) {
      if (w == undefined) w = this.width;
      let input = this.words;
      var n = document.createElement('span');
      n.style.display = 'inline-block';
      n.style.whiteSpace = 'pre';
      n.style.maxWidth = '100%';
      n.style.fontSize = '21px';
      n.style.fontFamily = '微软雅黑';
      n.innerHTML = input.value;
      input.parentNode.insertBefore(n, input.nextSibling);
      var spanW = n.getBoundingClientRect().width;
      input.parentNode.removeChild(n);
      // console.log(spanW);
      if (spanW > w) input.style.width = spanW + 'px';
      else input.style.width = w + 'px';
    },

    // 根据text，初始化typeBlocks
    updateGrid(text) {
      if (text === undefined) return;

      this.oldTbs = [...this.typeBlocks];
      // this.typeBlocks.splice(0, this.typeBlocks.length);
      this.typeBlocks.length = 0;
      if (text == '' || /^ +$/.test(text)) {
        let tcVue = this.parentCompt;
        let pos =
          tcVue != null && (tcVue.textType == TextType.VIRTUAL || tcVue.textType == TextType.VIRTUAL_CORNER)
            ? '&nbsp;'
            : XmlTags.W_QueSheng;
        this.typeBlocks.push({
          idx: 0,
          pos: pos,
          code: '',
          mod: ' ',
          active: false,
          text: '',
          hideTb: false,
          hideCode: false,
        });
        return;
      }

      let regex = new RegExp('(?<=\\s+)[^\\s]+\\s*|^\\s*[^\\s]+\\s*', 'g');
      let matchs = text.match(regex);
      // let matchs = text.match(/(?<=\s+)[^\s]+\s*|^\s*[^\s]+\s*/g)
      // console.log(text)
      // console.log(matchs)
      for (let index = 0; index < matchs.length; index++) {
        const blockText = matchs[index];
        let pos = 'x',
          code = '',
          mod = ' ';

        this.typeBlocks.push({
          idx: index,
          pos: pos,
          code: code,
          mod: mod,
          active: false,
          text: blockText,
          hideTb: false,
          hideCode: false,
        });
      }

      if (matchs.length <= 1) this.dynamicPos = '';
      else if (this.dynamicPos == '') {
        //虚词位总体词性
        this.dynamicPos = XmlTags.virtualPos(this.parentCompt.iniType);
      }
      // console.log(this.typeBlocks)
    },

    queryWordInfo(word, idx, dict, markDPos = true) {
      let _this = this;
      this.$jbwApi.queryWordInfo({ word: word, dict: dict, userdict: 1 }).then(function (response) {
        if (_this._isDestroyed) return;
        let data = response.data;
        let tbs = _this.typeBlocks;
        let tb = tbs.find((o) => o.idx == idx);
        // console.log(tb);
        if (tb == undefined) return;
        let word = tb.text.trim();

        let wordSets = null;
        // 如果有已标词，优先取已标词结果进行后续自动标注
        let editor = _this.getEditor();
        if (editor != null && editor.wordInfo != null && editor.wordInfo.containUserWord(word))
          wordSets = editor.wordInfo.userWords[word];

        let result = parser.parse(data, options);
        // console.log(result);
        if (
          wordSets == null &&
          result != null &&
          result.WordResult != null &&
          result.WordResult.length > 0 &&
          result.WordResult[0].WordSet != null
        ) {
          if (result.WordResult[0]._ciyu != word) return;
          wordSets = result.WordResult[0].WordSet;
        }

        // console.log(wordSets);
        if (wordSets == null) {
          if (_this.dynamicPos == '' && tb.pos == XmlTags.W_QueSheng) {
            let comp = _this.parentCompt;
            if (
              editor &&
              editor.dictType != DictType.XianHan &&
              comp &&
              comp.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin)
            )
              tb.pos = XmlTags.W_Ming;
          }
        } else {
          let sel = null;
          let limitPos = null; //限制所选词性
          let posArray = _this.comptPosList();
          //#region 旧成分限制词性逻辑
          // if (tb.pos == XmlTags.W_QueSheng) {
          //   let compt = _this.parentCompt;
          //   if (compt.iniType == XmlTags.C_Wei) {
          //     let reg = new RegExp("^" + _this.GlobalConst.DirectVRegex + "$");
          //     // 单个词充当谓语，考虑v、a、r
          //     if (_this.dynamicPos == "") {
          //       wordSets = wordSets.filter((o) => /[rva]/.test(o.pos) && !o.cilei.includes("趋向动词"));
          //       limitPos = [XmlTags.W_Dong, XmlTags.W_XingRong, XmlTags.W_Dai];
          //       // 合成谓语过滤
          //       if (compt.prdExtend() == PrdExtend.SYN) {
          //         let temps = wordSets.filter((o) => o.pos2 != null && o.pos2.includes("v⑤"));
          //         if (temps.length > 0) wordSets = temps;
          //       }
          //       // 右边辖域带非空宾语
          //       else if (
          //         compt
          //           .rightRegionCompts()
          //           .some((o) => o.belongIniType(XmlTags.C_Bin) && o.toXml().textContent != "")
          //       ) {
          //         let temps = wordSets.filter((o) => o.pos != null && o.pos.includes(XmlTags.W_Dong));
          //         if (temps.length > 0) wordSets = temps;
          //       }
          //     }
          //     // 符合趋向动词规则结尾的词
          //     else if (reg.test(word) && tb.idx == tbs.length - 1) {
          //       wordSets = wordSets.filter((o) => o.cilei.includes("趋向动词"));
          //       limitPos = [XmlTags.W_Dong];
          //     }
          //   }
          //   // ADV中Generic，考虑d、t、m
          //   else if (
          //     compt.iniType == XmlTags.O_Temp &&
          //     compt.parentCompt.iniType == XmlTags.C_Zhuang &&
          //     _this.dynamicPos == ""
          //   ) {
          //     let temps = wordSets.filter(
          //       (o) =>
          //         /[dt]/.test(o.pos) || (o.pos == XmlTags.W_Shu && o.pos2 != null && o.pos2.includes("m②"))
          //     );
          //     if (temps.length > 0) {
          //       wordSets = temps;
          //       limitPos = [XmlTags.W_Fu, XmlTags.W_Ming_ShiJian, XmlTags.W_Shu];
          //     }
          //   }
          // } else {
          //   wordSets = wordSets.filter((o) => o.pos.includes(tb.pos));
          //   limitPos = [tb.pos];
          // }
          //#endregion

          if (tb.pos == XmlTags.W_QueSheng) {
            // Y 单个词时，自动义项
            if (limitPos == null && _this.dynamicPos == '') {
              let compt = _this.parentCompt;
              // Y-1 ADV中Generic，考虑d、t、m
              if (compt.belongIniType(XmlTags.O_Temp) && compt.parentCompt.belongIniType(XmlTags.C_Zhuang)) {
                let temps = wordSets.filter(
                  (o) => /[dt]/.test(o.pos) || (o.pos == XmlTags.W_Shu && o.pos2 != null && o.pos2.includes('m②'))
                );
                if (temps.length > 0) {
                  wordSets = temps;
                  limitPos = [XmlTags.W_Fu, XmlTags.W_Ming_ShiJian, XmlTags.W_Shu];
                }
              }
              // Y-2 PRD自动义项限定在谓词（vaor）范围内
              else if (compt.belongIniType(XmlTags.C_Wei)) {
                let temps = wordSets.filter((o) => /[vaor]/.test(o.pos));
                if (temps.length > 0) {
                  wordSets = temps;
                  limitPos = [XmlTags.W_Dong, XmlTags.W_XingRong, XmlTags.W_NiSheng, XmlTags.W_Dai];
                }
              }

              if (limitPos == null) {
                let temps = wordSets.filter(
                  (o) =>
                    ((o.pos.length == 1 && posArray.contains(o.pos)) ||
                      o.pos.split('').some((p) => posArray.contains(p))) &&
                    o.pinci > 10
                );
                if (temps.length > 0) {
                  wordSets = temps;
                  limitPos = posArray;
                }
              }
            }
          } else {
            let temps = wordSets.filter((o) => o.pos.includes(tb.pos));
            if (temps.length > 0) {
              wordSets = temps;
              limitPos = [tb.pos];
            }
          }

          // 如果该词性义项唯一，则自动标注
          if (wordSets.length == 1 && !wordSets[0].hasOwnProperty('_' + DataTags.A_UnChk)) {
            sel = wordSets[0];
          }
          // 根据总数，频率，自动标注
          else if (wordSets.length > 1) {
            let maxSet = null,
              sum = 0,
              max = 0;
            wordSets.forEach((o) => {
              let pc = parseInt(o.pinci);
              if (pc > max) {
                max = pc;
                maxSet = o;
              }
              sum += pc;
            });
            let ratio = editor != null && editor.user != null ? editor.user.YimaRatio : 0.8;
            // 总词数大于10，频率大于ratio    属于现汉或者结果中不包含词典词 才进行自动标注
            if (
              sum > 10 &&
              max / sum > ratio &&
              (!maxSet.hasOwnProperty(DataTags.A_UnChk) ||
                wordSets.some((o) => o.hasOwnProperty('_' + DataTags.A_Version)))
            )
              sel = maxSet;
          }

          // console.log(sel);
          if (sel != null) {
            if (
              sel.state == '0' &&
              sel.mode != null &&
              sel.mode != '' &&
              tbs.filter((o) => o.pos != XmlTags.W_BiaoDian).length == 1
            ) {
              let oldText = _this.text.replace(/ /g, '');
              if (_this.oldText != oldText) {
                _this.oldText = oldText;
                let modeXml = new DOMParser().parseFromString(sel.mode, 'text/xml');
                if (modeXml.getElementsByTagName('parsererror').length == 0) {
                  _this.markDynamicWord(modeXml.firstElementChild, idx);
                  return;
                }
              }
            }

            if (sel.pos != '' && sel.pos.indexOf(tb.pos) < 0) {
              var sc = sel.pos.split('').firstOrDefault((o) => limitPos != null && limitPos.contains(o));
              if (sc != null) tb.pos = sc;
              else tb.pos = sel.pos.substring(0, 1);
            }

            if (_this.dynamicPos == '' && !posArray.contains(tb.pos)) {
              tb.pos = _this.defaultPos(sel.pos);
            }
            _this.updatePosByMod(markDPos); //根据规则，刷新动态词里的词性

            if (sel.yima != null && !sel.yima.startsWith('99')) {
              tb.code = sel.yima;
              if (editor != null && editor.wordInfo.text == word) {
                editor.wordInfo.activeCode = tb.code;
              }
            }

            if (_this.wordTypeMap.hasOwnProperty(word)) {
              _this.wordTypeMap[word].pos = tb.pos;
              _this.wordTypeMap[word].code = tb.code;
            }
          }
        }
      });
    },

    onMouseUp() {
      if (!this.editable) return;

      let at = this.getActiveType();
      if (at != null) {
        let change = this.activeType == at;
        this.activeType = at;
        if (!change) {
          let textTrim = at.text.trim();
          this.setWordInfo(textTrim, at.code);
        }
      }
    },

    onKeyUp(e) {
      let at = this.getActiveType();
      if (at != null) {
        let change = this.activeType == at;
        this.activeType = at;
        if (!change) {
          let textTrim = at.text.trim();
          this.setWordInfo(textTrim, at.code);
        }
      }
    },

    onKeyDown(e) {
      //禁止输入回车
      if (e.keyCode == 13) e.preventDefault();

      // 文本框内切换光标位置
      if (e.key == 'Tab') {
        let text = this.words.innerText;
        let pos = this.getCaretPosition();
        // Shift+Tab向左移动
        if (e.shiftKey) {
          if (pos == 0) pos = text.length;
          else {
            pos--;
            while (pos > 0 && /\s/.test(text.substring(pos - 1, pos))) pos--;
          }
        }
        // Tab向右移动
        else {
          if (pos == text.length) pos = 0;
          else {
            pos++;
            while (pos < text.length && /\s/.test(text.substring(pos, pos + 1))) pos++;
          }
        }
        this.setWordsCaret(this.words, pos);
        e.preventDefault();
      }
    },

    onFocus(e, resetCaret) {
      // console.log(e);
      if (this.parentCompt.editable) this.isFocused = true;
      let editor = this.getEditor();
      if (editor != null) {
        let at = this.getActiveType();
        if (at != null && this.activeType != at) {
          this.activeType = at;
          this.setWordInfo(at.text.trim(), at.code);
        }
        editor.focusedWordUnit = this;
        //首次标注词性或义项时，焦点框会闪一下
        if (editor.activeComponent == null) {
          editor.activeComponent = this.parentCompt;
          editor.activeComponent.isActive = true;
        }
      }

      if (resetCaret) {
        this.setWordsCaret(this.words, 0);
      }
    },

    onBlur(e) {
      // console.log(e);
      let range = Common.getRange(this.words);
      if (range != null) {
        this.lastRange.startOffset = range.startOffset;
        this.lastRange.endOffset = range.endOffset;
        this.lastRange.startContainer.textContent = range.startContainer.textContent;
        this.lastRange.anchorOffset = range.anchorOffset;
        this.lastRange.focusOffset = range.focusOffset;
      }

      this.isFocused = false;
      // 移除焦点type：仅当class添加prevented或no-wu-focus时不移除
      if (e == null || e.relatedTarget == null) this.activeType = null;
      else if (!/prevented/.test(e.relatedTarget.className)) {
        let labels = e.relatedTarget.labels;
        if (labels == null || labels.length <= 0 || !/no-wu-focus/.test(labels[0].className)) this.activeType = null;
      }
    },

    textfocus() {
      // let words = this.$refs.words;
      // console.log('textfocus')
      // this.setWordsCaret(words, this.innerText.length);
    },

    setUpperText(text) {
      this.parentCompt.updateParentItem('text', text);
    },

    setSelfText(text, setCaret) {
      let pos = this.getCaretPosition();
      // this.words.value = text;
      // this.innerText = text;
      this.words.innerText = text;

      if (setCaret)
        this.$nextTick(() => {
          if (pos < text.length) this.setWordsCaret(this.words, pos);
          else this.setWordsCaret(this.words, text.length);
        });
    },

    setWordMinWidth(mw) {
      this.words.style.minWidth = mw;
    },

    querySentOrWord() {
      let editor = this.getEditor();
      if (editor == null || editor.activeComponent == null) return;

      let text = this.words.innerText;
      let iniType = editor.activeComponent.iniType4Show;
      if (this.isFocused) editor.updateFloatInfo(iniType.toUpperCase(), text);
      else {
        editor.updateFloatInfo(iniType.toUpperCase());
        return;
      }

      if (text == '') return;
      let typesKeepW = this.typeBlocks;
      let typesNoW = typesKeepW.filter((o) => o.pos != XmlTags.W_BiaoDian);
      if (typesNoW.length == 0 || (typesNoW.length == 1 && typesNoW.some((o) => o.pos != XmlTags.W_QueSheng))) return;

      let contextString = '';
      let curCompt = '';
      let qType = editor == null ? 1 : 2;
      let dictType = editor.dictType;
      // let dictType =
      //   editor == null || editor.ActiveDiagram == null
      //     ? DictType.XianHan
      //     : editor.ActiveDiagram.dictType;

      let compt = this.parentCompt;
      if (compt == null) return;

      if (compt.iniType == XmlTags.O_Temp) {
        compt = compt.parentCompt;
        if (compt != null) curCompt = compt.iniType;
      } else curCompt = compt.iniType;

      curCompt = curCompt.toUpperCase();

      if (compt.iniType == XmlTags.C_Zhu) {
        //判断是否为独词
        var rights = compt.rightComptItems();
        if (rights != null && rights.some((p) => p.iniType == XmlTags.C_Wei)) contextString = 'V';
      } else contextString = GridUtil.contextOfPrd(compt);
      if (compt.textType != undefined && compt.textType != TextType.SOLID) qType = 1;

      //包含x、非w超过5个、首尾非w且w在非w中间的
      if (
        typesKeepW.some((p) => p.pos == XmlTags.W_QueSheng) ||
        typesKeepW.filter((p) => p.pos != XmlTags.W_BiaoDian).length > 5 ||
        (typesKeepW.firstOrDefault().pos != XmlTags.W_BiaoDian &&
          typesKeepW.lastOrDefault().pos != XmlTags.W_BiaoDian &&
          typesKeepW.some((p) => p.pos == XmlTags.W_BiaoDian))
      ) {
        // if (editor != null && editor.dictType != DictType.XianHan) return;

        qType = 0;
      }

      let allPos = typesKeepW.map((o) => o.pos).join('');
      let activeMode = '';
      let pos_chn_seq = ''; //词性音节序列
      for (let i = 0; i < typesNoW.length; i++) {
        const tb = typesNoW[i];
        activeMode += tb.pos;
        pos_chn_seq += tb.pos;
        let charNum = tb.text.trim().length;
        if (charNum > 1) {
          activeMode += charNum;
          pos_chn_seq += charNum;
        }
        if (tb.mod != undefined) activeMode += tb.mod;
      }
      activeMode = this.dynamicPos + ':' + activeMode;
      editor.floatShortcut.activeMode = activeMode.trim();
      editor.floatShortcut.queryText = text.trim();
      editor.floatShortcut.queryPos = allPos;

      let originWord = text.replace(/\s+/g, '');
      let key = originWord + allPos + this.parentCompt.iniType;
      if (this.queryQueue.contains(key)) return;

      this.queryQueue.push(key);
      editor.floatShortcut.querySentOrWord(
        this,
        text.trim(),
        allPos,
        curCompt,
        contextString,
        originWord,
        pos_chn_seq,
        dictType,
        qType
      );
    },

    // 获取当前光标坐在文字对应的TypeBlock
    getActiveType() {
      // if (!this.isFocused) return null;
      let text = this.words.innerText;
      if (text == '' && this.typeBlocks.length > 0) return this.typeBlocks[0];

      let idx = 0; //列号
      let len = 0; //文字长度
      let pos = this.getCaretPosition();
      let strs = text.split(/\s/);
      for (let i = 0; i < strs.length; i++) {
        const str = strs[i];
        if (pos >= len && pos <= len + str.length) {
          if (this.typeBlocks.length == 0) return null;
          if (str.length > 0) return this.typeBlocks[idx];
        }
        len += str.length + 1;
        if (str.length > 0) idx++;
      }
      return null;
    },

    // 查询当前光标所在模式的前一个TypeBlock如（A| B / A |B）中的A
    getModFirstType() {
      // if (!this.isFocused) return null;

      let text = this.words.innerText;
      let idx = 0; //列号
      let len = 0; //文字长度
      let pos = this.getCaretPosition();
      let strs = text.split(/\s/);

      // console.log("modeType");
      if (pos == 0 || pos == text.length) return null;

      let leftSpace = /\s/.test(text.substring(pos - 1, pos));
      let rightSpace = /\s/.test(text.substring(pos, pos + 1));
      //如果在多字词中间则返回null
      if (!leftSpace && !rightSpace) return null;

      //忽略中间标点
      let spanPunc = 0;
      let regex = new RegExp('^' + this.GlobalConst.PunctuationRegex + '+$');
      for (let i = 0; i < strs.length; i++) {
        const str = strs[i];
        if (pos >= len && pos <= len + str.length) {
          if (this.typeBlocks.length == 0) return null;
          if (str.length > 0) {
            if (idx != 0 && (leftSpace || regex.test(str))) idx = idx - spanPunc > 0 ? idx - spanPunc - 1 : 0;
            //光标在词最左边，忽略词中间的标点
            else if (pos <= len && spanPunc > 0) idx = idx - spanPunc;

            let tb = this.typeBlocks[idx];
            // 当前为标点
            if (tb.pos == XmlTags.W_BiaoDian) return null;
            // 后续都为标点
            if (
              pos < text.length &&
              text
                .substring(pos)
                .split(/\s/)
                .every((o) => regex.test(o) || o == '')
            )
              return null;

            return tb;
          }
        }
        len += str.length + 1;
        if (str.length > 0) {
          idx++;
          if (regex.test(str)) spanPunc++;
          else spanPunc = 0;
        }
      }
      return null;
    },

    checkDynamicWord() {
      this.showTotal = true;
      let tbs = this.typeBlocks;
      // console.log('checkDynamicWord', tbs.length);
      if (tbs == null || tbs.length <= 1) {
        this.showTotal = false;
        if (this.dynamicPos != '') this.dynamicPos = '';
        return;
      }

      if (tbs.length > 1) {
        let puncTbs = tbs.filter((o) => o.pos == XmlTags.W_BiaoDian);
        // console.log('checkDynamicWord', tbs.length, puncTbs.length);
        if (tbs.length - puncTbs.length > 1) {
          if (this.dynamicPos == '') {
            this.dynamicPos = XmlTags.W_QueSheng;
          }
        } else {
          this.showTotal = false;
          if (this.dynamicPos != '') {
            this.dynamicPos = '';
          }
        }
        return;
      }
    },

    /**
     * 标注动态词模式
     * markTbs  是否重新标注所有的TypeBlock，false时先按历史已有的处理
     */
    markDynamicWord(modeXml, idx, markTbs = false) {
      // console.log(modeXml.cloneNode(true));
      if (modeXml == null) return;
      if (!modeXml.hasAttribute(XmlTags.A_Mod)) return;

      let elems = modeXml.elements();
      let text = elems.map((o) => o.textContent).join(' ');

      // 不指定TypeBlock时，取当前焦点Type
      if (idx == null) idx = this.typeBlocks.indexOf(this.activeType);
      if (idx < 0) idx = 0;
      let bTbs = this.typeBlocks.slice(0, idx);
      // 当前TypeBlock的开始位置
      let pos = bTbs.length == 0 ? 0 : bTbs.map((o) => o.text.length).reduce((total, num) => total + num);
      let newText = this.wordReplace(this.words.innerText, text, pos);
      // console.log(newText);
      this.setUpperText(newText);
      this.setSelfText(newText);
      this.updateGrid(newText);
      this.markTypeBlocks(markTbs);

      let _this = this;
      //等innerText中updateGrid更新完后再标注词性和模式
      this.$nextTick(() => {
        let modRe = new RegExp(this.GlobalConst.ModMarkRegex, 'g');
        let matches = modeXml.getAttribute(XmlTags.A_Mod).match(modRe);

        let tbs = this.typeBlocks;

        for (let key in this.wordTypeMap) {
          if (!tbs.some((o) => o.text.trim() == key)) {
            delete this.wordTypeMap[key];
          }
        }

        // console.log(tbs.length);
        for (let i = 0; i < elems.length; i++) {
          const el = elems[i];
          let elText = el.textContent;
          let ni = i + idx;
          if (ni < tbs.length) {
            if (el.tagName != XmlTags.W_QueSheng) tbs[ni].pos = el.tagName;
            if (el.hasAttribute(XmlTags.A_Sen) && !el.getAttribute(XmlTags.A_Sen).startsWith('99'))
              tbs[ni].code = el.getAttribute(XmlTags.A_Sen);
            if (i < matches.length) tbs[ni].mod = matches[i];

            if (markTbs || !_this.wordTypeMap.hasOwnProperty(elText)) {
              _this.wordTypeMap[elText] = { pos: tbs[ni].pos, code: tbs[ni].code, mod: tbs[ni].mod };
            }
            if (tbs[ni].code == null || tbs[ni].code == '') {
              // if (tbs[ni].pos == XmlTags.W_QueSheng) {
              // todo 前一词触发updatePosByMod，可能会影响后面的词性赋值，需要精确到最后一个x的tb时才触发updatePosByMod
              this.markTypeBlock(tbs[ni], false);
            }
          }
        }

        if (this.isFocused) {
          //设置新焦点Type和光标位置
          let acIdx = idx + elems.length < tbs.length ? idx + elems.length : tbs.length - 1;

          // M-1 拆分后移动到最末尾tb，且文本长度大于1，则再向后移动一位
          let move1 = acIdx == tbs.length - 1 && tbs[acIdx].text.length > 1;
          // M-2 标注后下一个词是标点，且动态词末尾词长度大于1，则光标从末尾词开头后移一位，方便标注
          if (!move1) {
            let puncReg = new RegExp('^' + this.GlobalConst.PunctuationRegex + '+$');
            if (puncReg.test(tbs[acIdx].text.trim()) && tbs[acIdx - 1].text.trim().length > 1) {
              acIdx--;
              move1 = true;
            }
          }

          this.activeType = tbs[acIdx];
          let caret = 0;
          for (let i = 0; i < acIdx; i++) {
            caret += tbs[i].text.length;
          }
          if (move1) caret++;

          this.setWordsCaret(this.words, caret);
          this.setWordInfo(this.activeType.text.trim(), this.activeType.code);
        }

        if (this.comptPosList().contains(modeXml.tagName) && modeXml.tagName != XmlTags.W_QueSheng)
          this.dynamicPos = modeXml.tagName;
        else this.dynamicPos = this.defaultPos();

        this.updatePosByMod(markTbs);
      });
    },

    //标注全部TypeBlock
    markTypeBlocks(markTb = true) {
      let old = 0;
      let typeBlocks = this.typeBlocks;
      for (let i = 0; i < typeBlocks.length; i++) {
        const tb = typeBlocks[i];
        // 保留未修改词的标注信息，其他词走正常标注逻辑
        let oldIdx = this.reserveTypeBlock(tb, old);
        if (oldIdx > old) old = oldIdx;
        else if (markTb) this.markTypeBlock(tb);
      }
    },

    //标注单个TypeBlock
    markTypeBlock(tb, markDPos) {
      // console.log(tb);
      if (tb == null || tb.text == null || tb.text == '') return;

      //词性确定：逐步精确
      let word = tb.text.trim();
      let puncReg = new RegExp('^' + this.GlobalConst.PunctuationRegex + '+$');
      let tReg = new RegExp(this.GlobalConst.TWordRegex);
      let mReg = new RegExp(this.GlobalConst.MWordRegex);
      let tc = this.parentCompt;
      let defPos = this.defaultPos();
      let pos = tb.pos;
      let code = '';
      let queryWord = true;
      let editor = this.getEditor();
      let dictType = editor != null ? editor.dictType : DictType.XianHan;

      // 虚词位，赋默认值
      if (
        pos == XmlTags.W_QueSheng &&
        [XmlTags.W_Ming_Fangwei, XmlTags.W_Jie, XmlTags.W_Lian, XmlTags.W_Zhu].contains(defPos)
      ) {
        pos = defPos;
      }

      //标点
      if (puncReg.test(word)) {
        tb.pos = XmlTags.W_BiaoDian;
        pos = tb.pos;
      }
      // 时间词
      else if (word != '十分' && tReg.test(word)) tb.pos = XmlTags.W_Ming_ShiJian;
      // 连续英文字母
      else if (/^[a-zA-Z]+$/.test(word)) tb.pos = XmlTags.W_Ming;

      if (tb.pos != XmlTags.W_BiaoDian && tb.pos != XmlTags.W_QueSheng) {
        // 依句辨品
        if (this.dynamicPos == '' && !this.comptPosList().contains(tb.pos)) {
          tb.pos = this.defaultPos();
        }
      }

      if (tb.pos != XmlTags.W_BiaoDian) {
        if (dictType == DictType.XianHan && tb.code == '') {
          // 介词p
          if (pos == XmlTags.W_Jie && '将' == word) {
            code = '008';
          }
          // 连词c
          else if (pos == XmlTags.W_Lian) {
            // APP
            if (tc.iniType == XmlTags.V_Fun_APP && '即' == word) code = '005';
            else if (tc.belongIniType(XmlTags.C_CC, XmlTags.V_Fun_UNI1) && '而' == word) {
              var leftCompt = tc.nearestLeftCompt();
              if (leftCompt != null && leftCompt.iniType == XmlTags.C_Zhuang) code = '003';
              else if (leftCompt != null && leftCompt.belongIniType(XmlTags.C_Zhu) && leftCompt.text != '')
                code = '004';
              else code = '001';
            }
          }
          // 助词u
          else if (pos == XmlTags.W_Zhu) {
            // UU成分
            if (tc.iniType == XmlTags.C_UU) {
              if ('的' == word) code = tc.parentCompt.iniType == XmlTags.C_Bu ? '101' : '001';
              else if ('地' == word) code = '001';
              else if ('得' == word) code = '103';
              else if ('之' == word) code = '201';
            }
            // UV成分
            else if (tc.iniType == XmlTags.C_UV) {
              if ('的' == word) code = tc.isInMainLine ? '004' : '002';
              else if ('所' == word) {
                code = '102';
                let leftCompt = tc.nearestLeftCompt();
                if (leftCompt != null && leftCompt.iniType == XmlTags.C_Zhuang) {
                  let t = leftCompt.childrenItems.firstOrDefault((o) => o.belongType('TextCompt'));
                  if (t != null && /^[为被]/.test(word)) code = '101';
                }
              } else if ('了' == word) code = '002';
            }
            // UN成分
            else if (tc.iniType == XmlTags.C_UN && '的' == word) {
              code = '002';
            }
          }

          if ('了' == word && code == '') {
            pos = XmlTags.W_Zhu;
            code = '001';
          } else if ('来' == word) {
            if (tc.parentCompt.iniType == XmlTags.C_Bu) {
              pos = XmlTags.W_Dong;
              code = '201';
            } else if (tc.prdExtend() == PrdExtend.SYN) {
              pos = XmlTags.W_Dong;
              code = '005';
            }
          } else if ('去' == word) {
            if (tc.parentCompt.iniType == XmlTags.C_Bu) {
              pos = XmlTags.W_Dong;
              code = '201';
            } else if (tc.prdExtend() == PrdExtend.SYN) {
              pos = XmlTags.W_Dong;
              code = '008';
            }
          } else if ('是' == word) {
            if (tc.prdExtend() == PrdExtend.SYN) {
              pos = XmlTags.W_Dong;
              // 以“是……的”字结尾
              let pText = tc.parentCompt.toXml().textContent;
              code = /的[^\u4e00-\u9fa5]*$/.test(pText) ? '202' : '203';
            }
            // 独词或独立语中
            else if (
              (tc.belongIniType(XmlTags.C_Zhu) && tc.parentCompt.childrenItems.length == 1) ||
              (tc.belongIniType(XmlTags.O_Temp) && tc.parentCompt.belongIniType(XmlTags.C_Ind))
            ) {
              pos = XmlTags.W_Dong;
              code = '003';
            }
          } else if ('一切' == word) {
            pos = XmlTags.W_Dai;
            code = tc.iniType == XmlTags.O_Temp && tc.parentCompt.belongIniType(XmlTags.C_Ding) ? '001' : '002';
          } else if ('之' == word && tc.iniType == XmlTags.C_Bin) {
            let reg0 = new RegExp(this.GlobalConst.PunctuationRegex + '|\\s', 'g');
            if (this.words.innerText.replace(reg0, '') == '之') {
              pos = XmlTags.W_Dai;
              code = '101';
            }
          }
          // 词语：一
          else if ('一' == word) {
            let reg0 = new RegExp(this.GlobalConst.PunctuationRegex + '|\\s', 'g');
            // A一A
            if (/^(.)一\1$/.test(this.words.innerText.replace(reg0, ''))) {
              pos = XmlTags.W_Shu;
              code = '006';
            }
            // 一做副词
            else if (tc.iniType == XmlTags.O_Temp && tc.parentCompt.belongIniType(XmlTags.C_Zhuang)) {
              pos = XmlTags.W_Shu;
              code = /[就便]/.test(this.fullSent) ? '008' : '007';
            }
          }
          // 词语：这
          else if ('这' == word && tc.iniType == XmlTags.O_Temp && tc.parentCompt.belongIniType(XmlTags.C_Zhuang)) {
            pos = XmlTags.W_Dai;
            code = '003';
          }
          // X得X
          else if ('得' == word) {
            let reg0 = new RegExp(this.GlobalConst.PunctuationRegex, 'g');
            if (/^\s*(\S\S?)\s+得\s+(\S\S?)\s*$/.test(this.words.innerText.replace(reg0, ''))) {
              pos = XmlTags.W_Zhu;
              code = '102';
            }
          }
          // 不
          else if ('不' == word) {
            // 独词或独立语中
            if (
              (tc.belongIniType(XmlTags.C_Zhu) && tc.parentCompt.childrenItems.length == 1) ||
              (tc.belongIniType(XmlTags.O_Temp) && tc.parentCompt.belongIniType(XmlTags.C_Ind))
            ) {
              pos = XmlTags.W_Fu;
              code = '003';
            }
            // A不B
            else {
              let reg0 = new RegExp(this.GlobalConst.PunctuationRegex, 'g');
              let m0 = this.words.innerText.replace(reg0, '').match(/^\s*(\S\S?)\s+不\s+(\S\S?)\s*$/);
              // console.log(m0);
              if (m0 != null && m0[1] != m0[2]) {
                pos = XmlTags.W_Fu;
                code = '005';
              }
            }
          }
          // 好
          else if ('好' == word) {
            // 独词或独立语中
            if (
              (tc.belongIniType(XmlTags.C_Zhu) && tc.parentCompt.childrenItems.length == 1) ||
              (tc.belongIniType(XmlTags.O_Temp) && tc.parentCompt.belongIniType(XmlTags.C_Ind))
            ) {
              pos = XmlTags.W_XingRong;
              code = '008';
            }
          } else if ('那' == word) {
            if (tc.iniType == XmlTags.C_CC) {
              pos = XmlTags.W_Lian;
              code = '203';
            } else {
              pos = XmlTags.W_Dai;
              code = '201';
            }
          } else if ('忙' == word && tc.prdExtend() == PrdExtend.SYN) {
            pos = XmlTags.W_Dong;
            code = '002';
          } else if ('别' == word && tc.iniType == XmlTags.O_Temp && tc.parentCompt.belongIniType(XmlTags.C_Ding)) {
            pos = XmlTags.W_Dai;
            code = '002';
          } else if (
            '慌' == word &&
            tc.parentCompt.belongIniType(XmlTags.C_Bu) &&
            tc.parentCompt.cornerCompt.wuText == '得'
          ) {
            // todo 切分时延迟加载问题
            pos = XmlTags.W_XingRong;
            code = '101';
          }
          // 连续数词
          else if (word != '万一' && word != '一一' && mReg.test(word)) pos = XmlTags.W_Shu;
        }
        // 古汉
        else if ((dictType == DictType.GuJian || dictType == DictType.GuFan) && code == '') {
          if (word == '之') {
            if (tc.iniType == XmlTags.C_UU) {
              pos = XmlTags.W_Zhu;
              code = '041';
            } else if (tc.iniType == XmlTags.C_UV) {
              pos = XmlTags.W_Zhu;
              code = '042';
            }
          }
          // 而
          else if (word == '而') {
            if (tc.belongIniType(XmlTags.V_Fun_UNI1)) {
              code = '031';
            } else if (tc.iniType == XmlTags.C_CC) {
              let leftCompt = tc.nearestLeftCompt();
              if (leftCompt != null && leftCompt.text != '') {
                code = leftCompt.iniType == XmlTags.C_Zhu ? '041' : '021';
              }
            }
          } else if (word == '也' && tc.iniType == XmlTags.C_UN) {
            pos = XmlTags.W_Zhu;
            code = '031';
          }
          // 连续数词
          else if (word != '万一' && word != '一一' && mReg.test(word)) pos = XmlTags.W_Shu;
        }

        // 依句辨品
        if (this.dynamicPos == '' && pos != XmlTags.W_QueSheng && !this.comptPosList().contains(pos)) {
          pos = this.defaultPos();
        }

        if (code != '') {
          tb.pos = pos;
          tb.code = code;
          queryWord = false;
        }

        if (queryWord) {
          tb.pos = pos;
          this.updatePosByMod(); //提前更新词性，限定词形范围
          this.queryWordInfo(word, tb.idx, dictType, markDPos);
        }
      }

      if (this.wordTypeMap.hasOwnProperty(word)) {
        this.wordTypeMap[word].pos = pos;
        this.wordTypeMap[word].code = code;
      } else this.wordTypeMap[word] = { pos: tb.pos, code: tb.code, mod: '' };
    },

    //查询历史oldTbs，保留历史标注
    reserveTypeBlock(tb, idx) {
      if (tb.text == null) return idx;

      const textTrim = tb.text.trim();
      let isTag = false;
      let oldTb;
      //查询保留的标注信息，todo old指针应该随两个数组同步移动
      // for (let j = idx; j < this.oldTbs.length; j++) {
      //   oldTb = this.oldTbs[j];
      //   if (oldTb.pos != XmlTags.W_QueSheng && oldTb.text != null && oldTb.text.trim() == textTrim) {
      //     isTag = true;
      //     idx = j + 1;
      //     break;
      //   }
      // }
      let map = this.wordTypeMap;
      if (map.hasOwnProperty(textTrim) && map[textTrim].pos != XmlTags.W_QueSheng) {
        isTag = true;
        oldTb = map[textTrim];
        idx++;
      }

      if (isTag) {
        tb.pos = oldTb.pos;
        tb.code = oldTb.code;
        tb.mod = idx == this.typeBlocks.length ? ' ' : oldTb.mod;
      }

      return idx;
    },

    // 根据词法模式规则，更新相应TypeBlock的词性
    updatePosByMod(markDPos) {
      let typesNoW = this.typeBlocks.filter((o) => o.pos != XmlTags.W_BiaoDian);
      let len = typesNoW.length;
      if (len < 2) return;

      let dPos = '';
      let start = typesNoW[0];
      let end = typesNoW[len - 1];
      // console.log(start);

      let npPos = XmlTags.comptPosList(XmlTags.C_Zhu);
      let npDefPos = XmlTags.defaultPos(XmlTags.C_Zhu);
      let vpPos = XmlTags.comptPosList(XmlTags.C_Wei);
      let zzPos = vpPos.concat([XmlTags.W_Fu, XmlTags.W_Jie, XmlTags.W_Ming_Fangwei, XmlTags.W_Lian, XmlTags.W_Shu]);
      let dbPos = [XmlTags.W_Dong, XmlTags.W_Jie];
      let vpDefPos = XmlTags.defaultPos(XmlTags.C_Wei);
      let sbPos = vpPos.concat([XmlTags.W_Fu]);

      // 开头词
      switch (start.mod) {
        case ExprTags.Lex_BL:
          // case ExprTags.Lex_CD:
          if (len == 2) {
            end.pos = start.pos;
          }
          break;
        case ExprTags.Lex_CD:
          if (len == 2 && end.text.trim() == start.text.trim()) {
            end.pos = start.pos;
          }
          break;
        case ExprTags.Lex_SB:
          if (!vpPos.contains(start.pos)) start.pos = vpDefPos;
          break;
        case ExprTags.Lex_DB:
          if (!dbPos.contains(start.pos)) start.pos = vpDefPos;
          break;
        case ExprTags.Lex_ZW:
          if (!npPos.contains(start.pos)) start.pos = npDefPos;
          break;
      }
      // 结尾词
      switch (typesNoW[len - 2].mod) {
        case ExprTags.Lex_DZ:
          if (!npPos.contains(end.pos)) end.pos = npDefPos;
          break;
        case ExprTags.Lex_ZZ:
          if (!zzPos.contains(end.pos)) end.pos = vpDefPos;
          break;
        case ExprTags.Lex_SB:
          if (!sbPos.contains(end.pos)) end.pos = vpDefPos;
          break;
        case ExprTags.Lex_DB:
          if (!npPos.contains(end.pos)) end.pos = npDefPos;
          break;
        case ExprTags.Lex_ZW:
          if (!vpPos.contains(end.pos)) end.pos = vpDefPos;
          break;
      }

      // 双词素总体词性标注
      if (len == 2) {
        switch (start.mod) {
          case ExprTags.Lex_BL:
            // case ExprTags.Lex_CD:
            dPos = start.pos;
            break;
          case ExprTags.Lex_CD:
            if (end.text.trim() == start.text.trim()) {
              dPos = start.pos;
            }
            break;
          case ExprTags.Lex_DB:
            dPos = vpDefPos;
            break;
          case ExprTags.Lex_DZ:
          case ExprTags.Lex_ZZ:
            dPos = end.pos;
            break;
          case ExprTags.Lex_SB:
            dPos = vpDefPos;
            break;
          case ExprTags.Lex_QT:
            if (start.pos == XmlTags.W_Shu && end.pos == XmlTags.W_Liang) dPos = XmlTags.W_Shu;
            else if (start.pos == XmlTags.W_Ming && end.pos == XmlTags.W_Ming_Fangwei) dPos = XmlTags.W_Ming;
            else if (end.pos == XmlTags.W_Zhu) dPos = start.pos;
            break;
        }
      }
      if (markDPos && dPos != '' && this.comptPosList().contains(dPos)) this.dynamicPos = dPos;
    },

    // 更新词汇信息查询内容
    setWordInfo(text, code) {
      let editor = this.editor;
      if (editor != null && editor.floatShortcut != null) {
        // 先清空，再查询（防止相同词语不会触发查询）
        editor.wordInfo.queryWord('', '');
        editor.wordInfo.$nextTick(() => {
          editor.wordInfo.queryWord(text, code);
        });
      }
    },

    //针对input中pos位置的词语，替换为replace，返回替换后的input
    wordReplace(input, repalce, pos) {
      let idx = 0;
      let strs = input.split(' ');
      for (let i = 0; i < strs.length; i++) {
        idx += strs[i].length;
        if (pos <= idx) {
          strs[i] = repalce;
          break;
        }
        idx++;
      }
      return strs.join(' ');
    },

    // 从中提取文本。direction：朝向，0-从右到左选择，1-从左到右选择
    textExtract(textRegion, isCut) {
      let text = '';
      let range = Common.getRange(this.words);
      if (range == null) range = this.lastRange;
      if (range == null) return text;

      // console.log(range);
      let start = range.anchorOffset >= 0 ? range.anchorOffset : range.startOffset;
      let content = range.startContainer.textContent;
      switch (textRegion) {
        case TextRegion.ALL:
          text = this.words.innerText;
          break;
        case TextRegion.SELECT:
          text = content.slice(range.startOffset, range.endOffset);
          break;
        case TextRegion.FRONT:
          text = content.slice(0, start);
          break;
        case TextRegion.BEHIND:
          text = content.slice(start);
          break;
      }
      if (isCut) {
        let leftText;
        switch (textRegion) {
          case TextRegion.ALL:
            leftText = '';
            break;
          case TextRegion.SELECT:
            leftText = content.textContent.slice(0, range.startOffset) + content.textContent.slice(range.endOffset);
            break;
          case TextRegion.FRONT:
            leftText = content.slice(start);
            break;
          case TextRegion.BEHIND:
            leftText = content.slice(0, start);
            break;
        }
        leftText = leftText.trim();

        if (leftText != this.words.innerText) {
          this.setSelfText(leftText);
          this.setUpperText(leftText);
          this.updateGrid(leftText);
          this.markTypeBlocks();

          if (textRegion != TextRegion.FRONT && this.isFocused) {
            this.$nextTick(() => {
              this.setWordsCaret(this.words, leftText.length);
            });
          }

          if (this.isFocused) this.activeType = this.getActiveType();
        }
      }
      return text;
    },

    textFill(text, textRegion) {
      if (text.trim() == '') return;

      text = text.insertPuncSpace(false);
      // console.log("==" + text + "==");
      switch (textRegion) {
        case TextRegion.ALL:
          this.words.innerText = text.trim();
          break;
        case TextRegion.SELECT:
          // this.words.innerText =
          //   input.valuet.slice(0, this.words.selectionStart) +
          //   text +
          //   input.value.slice(this.words.selectionEnd);
          break;
        case TextRegion.FRONT:
          this.words.innerText = (text + this.words.innerText.insertPuncSpace(false)).trim();
          break;
        case TextRegion.BEHIND:
          this.words.innerText = (this.words.innerText.insertPuncSpace(false) + text).trim();
          break;
      }

      // console.log("==" + this.words.innerText + "==");
      this.setUpperText(this.words.innerText);
      // if (!this.isFocused) this.updateGrid(text);
      this.updateGrid(this.words.innerText);
      this.markTypeBlocks();
    },

    //向后移动光标，并激活activeType。 type=1时，标注mod，需要多移一个词
    moveToNext(type) {
      let tbs = this.typeBlocks;
      let idx = tbs.indexOf(this.activeType);
      let nd = -1;

      let pos = this.getCaretPosition();
      if (
        type == 1 &&
        tbs
          .filter((o) => o.idx < idx)
          .map((o) => o.text)
          .join('').length == pos
      ) {
        idx--;
      }

      for (nd = idx + 1; nd < tbs.length; nd++) {
        const tb = tbs[nd];
        //碰到w，自动后移
        if (tb.pos != XmlTags.W_BiaoDian) break;
      }

      // console.log(nd);
      if (nd > -1 && nd < tbs.length) {
        let start = 0;
        for (let i = 0; i < nd; i++) {
          const tb = tbs[i];
          start += tb.text.length;
        }
        if (type == 1) start += tbs[nd].text.trim().length;

        this.setWordsCaret(this.words, start);
        // this.words.selectionStart = start;
        this.activeType = tbs[nd];

        return true;
      }

      return false;
    },

    getRange() {
      return Common.getRange(this.words);
    },

    // 获取div的光标位置。direction：朝向，0-从右到左选择，1-从左到右选择
    getCaretPosition(editableDiv, direction) {
      if (editableDiv == undefined) editableDiv = this.words;

      let caretPos = 0,
        _range = Common.getRange(this.words);

      if (_range != null) {
        if (window.getSelection) {
          caretPos = direction > 0 ? _range.startOffset : _range.endOffset;
        } else if (document.selection && document.selection.createRange) {
          var tempEl = document.createElement('span');
          editableDiv.insertBefore(tempEl, editableDiv.firstChild);
          var tempRange = _range.duplicate();
          tempRange.moveToElementText(tempEl);
          tempRange.setEndPoint('EndToEnd', _range);
          caretPos = tempRange.text.length;
        }
      }
      return caretPos;
    },

    setWordsCaret(target /*: HTMLDivElement*/, caret) {
      // console.log(target)
      if (!target) return;

      // const selection = window.getSelection();
      // 根据None判断，Ctrl切复句是，Grid2Stack后无焦点会直接返回
      // if (selection.type == "None") return;

      target.focus();
      let textNode = target.firstChild;
      if (textNode == null) {
        textNode = document.createTextNode('');
        target.appendChild(textNode);
      }
      // let caret = this.text.length;
      // let caret = this.innerText.length;
      let range = document.createRange();
      range.selectNodeContents(textNode);
      if (caret <= textNode.length) {
        range.setStart(textNode, caret);
        range.setEnd(textNode, caret);
      }
      range.collapse(true);
      let sel = window.getSelection();
      sel.removeAllRanges();
      if (document.body.contains(range.commonAncestorContainer)) sel.addRange(range);

      // console.log(caret)
    },

    toXml() {
      let xmlDoc = new Document();
      let elems = [];
      let tbs = [...this.typeBlocks];
      let mod = '',
        dpElem = null;
      let puncs = [];

      if (this.dynamicPos != '' && this.showTotal) dpElem = xmlDoc.createElement(this.dynamicPos);

      let lastNW = tbs.lastOrDefault((o) => o.pos != XmlTags.W_BiaoDian);
      for (let i = 0; i < tbs.length; i++) {
        const tb = tbs[i];
        if (tb.pos == '&nbsp;') break;
        let elem = xmlDoc.createElement(tb.pos);
        if (tb.code != null && tb.code != '') {
          elem.setAttribute('sen', tb.code);
        }

        let textTrim = tb.text.trim();
        elem.textContent = textTrim;

        if (tb.pos == XmlTags.W_BiaoDian) {
          //动态词中间标点处理
          if (dpElem != null && dpElem.hasChildNodes()) puncs.push(elem);
          //动态词开始标点
          else elems.push(elem);
        } else if (dpElem != null) {
          //动态词中间标点处理，归于mod节点内部
          if (puncs.length > 0) {
            for (let i = 0; i < puncs.length; i++) {
              const punc = puncs[i];
              dpElem.appendChild(punc);
            }
            puncs.length = 0;
          }
          // mod += tb.pos + (textTrim.length == 1 ? '' : textTrim.length) + (i < tbs.length - 1 ? tb.mod : '')
          mod +=
            tb.pos +
            (textTrim.length == 1 ? '' : textTrim.length) +
            (tb.mod == undefined || tb == lastNW ? ' ' : tb.mod);
          dpElem.appendChild(elem);
        } else elems.push(elem);
      }
      if (dpElem != null) {
        dpElem.setAttribute('mod', mod.trim());
        elems.push(dpElem);
      }

      //动态词结尾标点，不归于动态词节点
      if (puncs.length > 0) {
        for (let i = 0; i < puncs.length; i++) {
          const punc = puncs[i];
          elems.push(punc);
        }
      }
      return elems;
    },

    fromXml(xmls, autoTag) {
      // console.log(xmls);
      if (xmls == null || xmls.length == 0) {
        this.updateGrid('');
        this.isLoaded = true;
        this.$emit('wu-loaded');
        return;
      }
      let elems = xmls.descendantsAndSelf().filter((o) => o.firstElementChild == null);
      let text = elems.map((o) => o.textContent).join(' ');

      this.setSelfText(text);
      this.setUpperText(text);
      this.updateGrid(text);

      let mods = null;
      if (xmls.some((o) => o.firstElementChild != null)) {
        let first = xmls.find((o) => o.firstElementChild != null);
        if (first != undefined) {
          this.dynamicPos = xmls.find((o) => o.firstElementChild != null).tagName;
          if (first.hasAttribute(XmlTags.A_Mod)) {
            let modRe = new RegExp(this.GlobalConst.ModMarkRegex, 'g');
            mods = first.getAttribute(XmlTags.A_Mod).match(modRe);
          }
        }
      } else this.dynamicPos = '';

      let mi = 0;
      // console.log(this.typeBlocks);
      for (let i = 0; i < this.typeBlocks.length; i++) {
        const tb = this.typeBlocks[i];
        //先从xmls中读取词性、义项、模式信息
        if (i < elems.length) {
          tb.pos = elems[i].tagName;
          let elText = elems[i].textContent;
          if (autoTag && tb.pos == XmlTags.W_QueSheng) {
            this.markTypeBlock(tb);
          } else if (elems[i].hasAttribute(XmlTags.A_Sen)) tb.code = elems[i].getAttribute(XmlTags.A_Sen);

          if (elems[i].tagName != XmlTags.W_BiaoDian && mods != null) tb.mod = mods[mi++];

          if (elText != '' && !this.wordTypeMap.hasOwnProperty(elText)) {
            this.wordTypeMap[elText] = { pos: tb.pos, code: tb.code, mod: tb.mod };
          }
        }
        //由于updateGrid多出TypeBlock，且不在xmls的范围内
        else if (tb.pos == XmlTags.W_QueSheng) {
          this.markTypeBlock(tb);
        }
      }
      this.isLoaded = true;
      this.$emit('wu-loaded');
      // console.log(text);
    },

    active() {
      this.editable = true;
      this.checkDynamicWord();
      this.typeBlocks.forEach((o) => {
        o.hideCode = false;
        o.hideTb = false;
        o.lock = false;
      });
    },

    deActive(hideCode, hideTb) {
      this.editable = false;

      if (hideTb) this.showTotal = false;
      this.typeBlocks.forEach((o) => {
        o.hideCode = hideCode;
        o.hideTb = hideTb;
        o.lock = true;
      });
    },
  },

  watch: {
    text: {
      handler(newVal, oldVal) {
        // console.log("ne:" + newVal + "oe:" + oldVal);
        // if (!this.isFocused && !this.innerText) {
        //   this.$nextTick(() => {
        //     this.innerText = newVal;
        //   });
        // }

        //屏蔽首尾空格
        let nvTrim = newVal.trim();
        if (nvTrim == oldVal) {
          this.setSelfText(oldVal);
          return;
        } else if (oldVal != undefined && newVal == oldVal.trim()) {
          return;
        }
        //删除首尾文字，中间文字两边带空格的情况
        else if (nvTrim != newVal) {
          newVal = nvTrim;
          this.setSelfText(nvTrim);
        }

        if (this.isFocused && this.activeType != null) {
          this.setWordInfo(this.activeType.text.trim(), '');
        }
        this.querySentOrWord();

        let pCompt = this.parentCompt;
        if (pCompt.iniType == XmlTags.V_Fun_UNI) {
          // console.log('innerText:' + newVal)
          let prd = pCompt.parentCompt.getChild(pCompt.row, pCompt.column, PrdSep);
          prd.classType2 = newVal == '' ? '' : '-l';
        }

        // this.updateGrid(newVal);
        this.setUpperText(newVal);
      },
      // immediate: true
    },

    activeType: function (newVal, oldVal) {
      if (newVal != null) {
        newVal.active = true;
        // console.log(newVal);
        //todo 优化查询，减少查询次数，   最后一个词更改时，也不会触发
        this.querySentOrWord();
      }
      if (oldVal != null) oldVal.active = false;
    },
  },

  computed: {
    fullSent: {
      get() {
        let sent = '';
        let diagram = this.ancestor('Diagram');
        if (diagram == null) return sent;

        sent = diagram.encodeXml().textContent;
        return sent;
      },
      cache: false,
    },
  },
  components: { TypeBlock },
};
</script>
