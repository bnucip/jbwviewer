<template>
  <div v-show="showDiagram" ref="gramDiv" :class="rootClass" @click.stop="gramClick" @touchmove="onTouchMove">
    <component :is="type" :iniType="XmlTags.O_Sent" :style="'min-width:' + minWidth + 'px;'" :xml="xml"
               ref="compt" v-on:compt-loaded="comptLoaded" v-on:line-loaded="lineLoaded"></component>
    <img class="hidImg" />
  </div>
</template>

<script>
// import _ from 'lodash';
import XmlTags from '../api/xml_tags';
import DictType from '../enum/dict_type';
import Keys from '../enum/storage_key';

import GridCompt from './GridCompt.vue';
import StackCompt from './StackCompt.vue';

// import HistoryManager from '../api/history_manager';
import Common from '../api/common';
import html2canvas from 'html2canvas';
import { Loading, QSpinnerFacebook } from 'quasar';
import { ref, defineComponent, getCurrentInstance, computed, watch, shallowRef, provide, readonly } from 'vue';

export default defineComponent({
  name: 'Diagram',
  props: {
    parentDiv: Object,
    editor: Object,
  },

  setup(props, ctx) {
    const { proxy } = getCurrentInstance();

    const showDiagram = ref(false);
    const xml = ref(); // Element
    // xml.value = '<ju dct="0"><xj><sbj><x/></sbj><prd scp="V"><x/></prd></xj></ju>'.toXml();
    const isLoaded = ref(false); // 图形是否加载完成
    const sentIds = ref([]); // 图形相关句ids
    const isPara = ref(false); // 根据xml数据判断
    const editor = ref(props.editor);
    const parentDiv = computed(() => {
      return props.parentDiv;
    });
    const activeElement = ref(); // 记录当前焦点所对应的HTML元素
    const activeComponent = ref(); // 当前焦点成分
    const focusedWordUnit = ref(); // 当前焦点成分里的WordUnit q-btn添加prevented后也会导致丢失焦点，所以存一个全局变量
    const showActionTip = ref(false); // 是否展示提示框
    const actionTipContent = ref(''); // 提示框文字内容

    const upActiveComponent = (v) => {
      activeComponent.value = v;
    };
    const upFocusedWordUnit = (v) => {
      focusedWordUnit.value = v;
    };
    const acMovingToolTip = (show, content) => {
      showActionTip.value = show;
      actionTipContent.value = content;
    };
    const acDragging = (targetCompt, showBurst = false) => {
      let args = {
        targetCompt: targetCompt,
        showBurst: showBurst,
        tipContent: actionTipContent.value,
      };
      ctx.emit('active-compt-dragging', args);
    };
    provide(Keys.JbwEditor, editor);
    provide(Keys.DiagramParentDiv, parentDiv);
    provide(Keys.ActiveComponent, readonly(activeComponent));
    provide(Keys.UpActiveComponent, upActiveComponent);
    provide(Keys.FocusedWordUnit, readonly(focusedWordUnit));
    provide(Keys.UpFocusedWordUnit, upFocusedWordUnit);
    provide(Keys.AC_Moving_Tooltip, acMovingToolTip);
    provide(Keys.AC_Dragging, acDragging);

    // 展开 收起
    const rootClass = ref('root-diagram');
    const isOpen = ref(null); // 当前是否展开
    watch(isOpen, (nv) => {
      if (editor.value) rootClass.value = nv ? 'root-diagram-close' : 'root-diagram-open';
    });

    const gramDiv = ref({});
    const compt = ref({}); // 当前图形的VueComponent（GridCompt或StackCompt）
    const type = shallowRef(GridCompt); //图形类型 GridCompt/StackCompt
    // 单击标注图形
    const gramClick = (e) => {
      // console.log(e);
      if (isPara.value) {
        let after = window.getComputedStyle(gramDiv.value, 'after');
        let top = parseInt(after.top.replace('px', ''));
        let right = parseInt(after.right.replace('px', ''));
        let width = parseInt(after.width.replace('px', ''));
        let height = parseInt(after.height.replace('px', ''));
        let x2 = e.clientX - right + parentDiv.value.scrollLeft - parentDiv.value.offsetLeft + 2;
        let x1 = x2 - width;
        let y1 = top;
        let y2 = top + height;
        // console.log('x:' + e.layerX + '\tx1:' + x1 + '\tx2:' + x2 + '\ty:' + e.layerY + '\ty1:' + y1 + '\ty2:' + y2);

        // 通过光标与伪元素距离layerY和样式类来判断是否点击在符号标记上
        if (x1 <= e.layerX && e.layerX <= x2 && y1 < e.layerY && e.layerY < y2) {
          isOpen.value = !isOpen.value;
          compt.value.expandAll(isOpen.value);
        }
      }
    };

    const minWidth = ref(0);
    // 重新计算成分最小宽度
    const computeComptMinWidth = () => {
      if (compt.value != null && compt.value.belongType(StackCompt)) {
        let max = 0;
        compt.value.gridCompts().forEach((o) => {
          // console.log(o.x + o.$el.offsetWidth);
          if (o.x + o.$el.offsetWidth > max) max = o.x + o.$el.offsetWidth;
        });
        max += 8;
        minWidth.value = max;
      }
    };

    const loadCount = ref(0); // 通过加减来控制Loading展示隐藏
    watch(loadCount, (nv) => {
      if (nv > 0 && !Loading.isActive) Loading.show({ spinner: QSpinnerFacebook, message: '分析中…' });
      else if (nv <= 0 && Loading.isActive) {
        Loading.hide();
        // 全部分析完成后，调整线条位置
        if (compt.value.belongType(StackCompt)) {
          compt.value.adjustAllLine();
        }
      }
    });

    //#region 操作记录相关
    const tagger = ref(''); // 当前标注者，用于record记录时对应的key
    // const historyManager = new HistoryManager(proxy);
    const undo = () => {
      // if (historyManager == null) return;
      // historyManager.undo();
    };
    const redo = () => {
      // if (historyManager == null) return;
      // historyManager.redo();
    };
    //#endregion

    //#region 图形线条相关
    const clear = () => {
      clearLine();
      compt.value.items = [];
      showDiagram.value = false;
      // historyManager.reset();
    };

    const clearLine = () => {
      // console.log('clear', compt.value.belongType(StackCompt));
      if (compt.value.belongType(StackCompt)) {
        let grids = [];
        Common.traverseType(compt.value, GridCompt, grids);
        // console.log(grids.length);
        grids.forEach((o) => {
          if (o.isMainSent) {
            o.clearLine();
          }
        });
      }
    };
    const linePosition = () => {
      if (compt.value.belongType(StackCompt)) {
        setTimeout(() => {
          compt.value.adjustAllLine();
          computeComptMinWidth();
        }, 20);
      }
    };
    //#endregion

    //#region 图形编解码
    //图形转XML对象 encodeAuto：是否编码未分析句子
    const encodeXml = (encodeAuto = true) => {
      let dict = editor.value && editor.value.dictType ? editor.value.dictType : DictType.XianHan;
      let outer;
      // todo editor迁移
      // 段落数据 para->ju->xj
      if (isPara.value) {
        outer = document.createElementNS(null, XmlTags.C_Para);
        let ju = document.createElementNS(null, XmlTags.C_FullSent);
        ju.setAttribute(XmlTags.A_Dict, dict);

        // 单句
        if (compt.value.belongType(GridCompt)) {
          let xj = compt.value.toXml();
          // encodeAuto=false时，初始化未分析的句子和非句不保存
          if (xj != null && (encodeAuto || (!xj.hasAttribute(XmlTags.A_Auto) && !xj.hasAttribute(XmlTags.A_Ignore)))) {
            ju.setAttribute(XmlTags.A_Id, xj.getAttribute(XmlTags.A_Id));
            xj.setAttribute(XmlTags.A_Id, 1);
            ju.append(xj);
          }
          outer.append(ju);
        }
        // 复句
        else if (compt.value.belongType(StackCompt)) {
          let sentId = 0;
          let xjs = compt.value.toXml().elements(XmlTags.C_Sent);
          let xjId = 1;
          for (let i = 0; i < xjs.length; i++) {
            const xj = xjs[i];
            // encodeAuto=false时，初始化未分析的句子和非句不保存
            if (!encodeAuto && (xj.hasAttribute(XmlTags.A_Auto) || xj.hasAttribute(XmlTags.A_Ignore))) continue;

            let sId = parseInt(xj.getAttribute(XmlTags.A_Id));
            if (sentId == 0) {
              ju.setAttribute(XmlTags.A_Id, sId);
              sentId = sId;
            } else if (sentId != sId) {
              // 相同xj合到同一ju中
              outer.append(ju);
              ju = document.createElementNS(null, XmlTags.C_FullSent);
              ju.setAttribute(XmlTags.A_Dict, dict);
              ju.setAttribute(XmlTags.A_Id, sId);
              sentId = sId;
              xjId = 1;
            }
            xj.setAttribute(XmlTags.A_Id, xjId++);
            // xj.removeAttribute(XmlTags.A_Id);

            // 非句标记移到ju节点
            if (xj.hasAttribute(XmlTags.A_Ignore)) {
              ju.setAttribute(XmlTags.A_Ignore, xj.getAttribute(XmlTags.A_Ignore));
              xj.removeAttribute(XmlTags.A_Ignore);
            }

            ju.append(xj);
          }

          if (ju.childElementCount > 0) outer.append(ju);
        }
      }
      // 非段落数据ju->xj
      else {
        outer = document.createElementNS(null, XmlTags.C_FullSent);
        outer.setAttribute(XmlTags.A_Dict, dict);
        // 单句
        if (compt.value.belongType(GridCompt)) {
          let xj = compt.value.toXml();
          xj.setAttribute(XmlTags.A_Id, 1);
          outer.append(xj);
        }
        // 复句
        else if (compt.value.belongType(StackCompt)) {
          let xjs = compt.value.toXml().elements();
          let xjId = 1;
          xjs.forEach((xj) => xj.setAttribute(XmlTags.A_Id, xjId++));
          outer.appendArray(xjs);
        }
      }
      // console.log(outer.cloneNode(true));
      return outer;
    };

    // 加载XML到图形
    const decodeXml = async (_xml, setSvgInDiv = false, autoParse = false) => {
      // console.log(xml);
      // console.log(Object.prototype.toString.call(_xml));
      if (_xml == null) return;
      showDiagram.value = true;

      let _editor = editor.value;
      let ids = [];
      // para->ju->xj结构XML处理，降为ju->xj
      // 段落标注
      if (_xml.tagName == XmlTags.C_Para) {
        let newJu = document.createElementNS(null, XmlTags.C_FullSent);
        let jus = _xml.elements(XmlTags.C_FullSent);
        if (jus.length > 0 && jus[0].hasAttribute(XmlTags.A_Dict))
          newJu.setAttribute(XmlTags.A_Dict, jus[0].getAttribute(XmlTags.A_Dict));
        let beUn = false; // 有收起的句子，则收起状态需为true
        for (let i = 0; i < jus.length; i++) {
          const ju = jus[i];
          if (ju.hasAttribute(XmlTags.A_Id)) ids.push(parseInt(ju.getAttribute(XmlTags.A_Id)));
          ju.elements(XmlTags.C_Sent).forEach((o) => {
            if (ju.hasAttribute(XmlTags.A_Id)) o.setAttribute(XmlTags.A_Id, ju.getAttribute(XmlTags.A_Id));
            if (ju.hasAttribute(XmlTags.A_Auto)) o.setAttribute(XmlTags.A_Auto, ju.getAttribute(XmlTags.A_Auto));
            if (ju.hasAttribute(XmlTags.A_Ignore)) o.setAttribute(XmlTags.A_Ignore, ju.getAttribute(XmlTags.A_Ignore));

            if (!beUn && (o.hasAttribute(XmlTags.A_Auto) || o.getAttribute(XmlTags.A_Expand) == '0')) beUn = true;
            newJu.append(o);
          });
        }
        isOpen.value = !beUn;
        // console.log(newJu.cloneNode(true));
        _xml = newJu;
        isPara.value = true;
      }
      // 整句标注
      else {
        // console.log(_xml.cloneNode(true));
        let xjs = _xml.elements(XmlTags.C_Sent);
        xjs.forEach((xj) => {
          if (xj.hasAttribute(XmlTags.A_Id)) xj.removeAttribute(XmlTags.A_Id);
        });

        isPara.value = false;
      }

      xml.value = _xml;
      if (_editor && _editor.wordInfo && _xml.hasAttribute(XmlTags.A_Dict)) {
        // todo editor迁移
        _editor.wordInfo.setDict(_xml.getAttribute(XmlTags.A_Dict));
      }

      sentIds.value = ids;
      isLoaded.value = false;
      proxy.XmlParser.initialItems(proxy, autoParse);

      let i = 0;
      let lineLoaded = false;
      // 采用定时器判断图形和句间关系是否加载完毕
      await new Promise((resolve, reject) => {
        let int = setInterval(() => {
          // 通过GridCompt.lineLoaded来判断句间关系是否加载完毕
          let gcs = [];
          if (isComptLoaded.value) {
            if (compt.value && compt.value.belongType(StackCompt)) {
              gcs = compt.value.gridCompts();

              if (gcs.every((o) => o.lineLoaded)) {
                // 自动分析时，构建依存弧
                if (autoParse) compt.value.buildDependArc();
                // 否则，加载已有
                else compt.value.adjustAllLine();
                // gcs.forEach(o => (o.lineComptLoaded = false));
              }

              if (gcs.every((o) => o.lineLoaded)) {
                lineLoaded = true;
              }

              // gcs.forEach(o => {
              //   if (!o.lineLoaded) {
              //     console.log("!lineLoaded");
              //     console.log(o);
              //   }
              //   if (!o.lineComptLoaded) {
              //     console.log("!lineComptLoaded");
              //     console.log(o);
              //   }
              // });
            } else lineLoaded = true;
          }

          if (isComptLoaded.value && lineLoaded) {
            isLoaded.value = true;
            console.log('Diagram-isLoaded');
            clearInterval(int);
            resetLoaded(gcs);
            resolve();
          }

          if (i > 50) {
            console.log('isComptLoaded:' + isComptLoaded.value);

            isComptLoaded.value = false;
            clearInterval(int);
            resetLoaded(gcs);
            reject('diagram-decodeXml');
          }
          i++;
        }, 30);
      });

      // if (!setSvgInDiv) {
      //   if (compt.value.belongType('StackCompt')) {
      //     let gcs = compt.value.gridCompts();
      //     gcs.forEach((o) => {
      //       props.parentDiv.appendChild(o.lineSvg);
      //       if (o.lineSvgArea) {
      //         props.parentDiv.appendChild(o.lineSvgArea);
      //       }
      //       if (o.relDiv) {
      //         props.parentDiv.appendChild(o.relDiv);
      //       }
      //       if (o.subDiv) {
      //         props.parentDiv.appendChild(o.subDiv);
      //       }
      //       if (o.biasDiv) {
      //         props.parentDiv.appendChild(o.biasDiv);
      //       }
      //     });
      //   }
      // }
    };

    const resetLoaded = (gcs) => {
      gcs.forEach((o) => {
        o.lineLoaded = false;
        o.childrenLoaded = false;
      });
    };

    // 恢复记录时加载XML到图形
    const historyDecodeXml = (_xml) => {
      // console.log("historyDecodeXml");
      // C1 段落标注走小句恢复逻辑
      if (editor.value != null && editor.value.isPara) {
        let curXml = encodeXml();
        let xjs1 = curXml.elements().descendantsAndSelf(XmlTags.C_Sent);
        let xjs2 = _xml.elements().descendantsAndSelf(XmlTags.C_Sent);
        // console.log(curXml.cloneNode(true));
        // console.log(_xml.cloneNode(true));
        // 1.1 xj数量一致
        if (xjs1.length == xjs2.length && xjs1.length > 1) {
          let childrenItems = compt.value.childrenItems;
          let isFrom = false;
          for (let i = 0; i < xjs1.length; i++) {
            const cur = xjs1[i];
            const xj = xjs2[i];
            // console.log(cur.parentNode.cloneNode(true));
            // console.log(xj.parentNode.cloneNode(true));

            // 1.1.1 xj父节点ju的id 一致，且内容有变化，走小句恢复逻辑
            if (cur.parentNode.getAttribute(XmlTags.A_Id) == xj.parentNode.getAttribute(XmlTags.A_Id)) {
              if (cur.toPlainString() != xj.toPlainString()) {
                // console.log("cur-xj:", cur.toPlainString(), xj.toPlainString());
                let gc = childrenItems.find((o) => o.row == i + 1 && o.belongType(GridCompt));
                // console.log(gc);
                // console.log(gc.toXml().cloneNode(true));
                xj.removeAttribute(XmlTags.A_Id);
                if (gc != null) {
                  isFrom = true;
                  gc.updateParentItem('xml', xj);
                  gc.items = [];
                  gc.$nextTick(() => {
                    gc.fromXml();
                  });
                }
              }
            }
            // 1.1.2 xj父节点ju的id不一致，暂时按整体恢复
            else {
              // console.log("diff", _xml.cloneNode(true));
              clearLine();
              isFrom = false;
              decodeXml(_xml);
              break;
            }
          }
          if (isFrom)
            setTimeout(() => {
              // todo 应该优化为所有gc.fromXml加载图形完成后调用线条调整和计算宽度
              compt.value.adjustAllLine();
              computeComptMinWidth();
            }, 100);
        }
        // 1.2 xj数量不一致时，暂时按整体恢复
        else {
          // console.log("whole", _xml.cloneNode(true));
          clearLine();
          decodeXml(_xml);
        }
      }
      // C2 整句标注整体恢复
      else {
        clearLine();
        decodeXml(_xml);
      }
    };

    const diagram2Base64 = async () => {
      // 1.先把连接线svg转成图片
      let svgElems = [];
      let svgDef = document.getElementById('leader-line-defs');
      if (svgDef) {
        let style = svgDef.firstElementChild;
        let defs = svgDef.lastElementChild;

        if (compt.value.belongType(StackCompt)) {
          let gcs = compt.value.gridCompts();
          gcs.forEach((o) => {
            svgElems.push(o.lineSvg);
            if (o.lineSvgArea) svgElems.push(o.lineSvgArea);
          });
        }

        // console.log("1:" + _.now());
        for (let i = 0; i < svgElems.length; i++) {
          const svg = svgElems[i];
          // console.log(svg.cloneNode(true));
          svg.appendChild(style.cloneNode(true));
          svg.appendChild(defs.cloneNode(true));

          let img = Common.svgToImage(svg);
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');
          // todo 修改写法，build报错
          // await new Promise((resolve) => {
          //   img.onload = function () {
          //     canvas.className = 'copy-diagram-canvas';
          //     canvas.width = img.width;
          //     canvas.height = img.height;
          //     canvas.style.position = 'fixed';
          //     canvas.style.left = img.style.left;
          //     canvas.style.top = img.style.top;
          //     ctx.drawImage(img, 0, 0);
          //     gramDiv.value.appendChild(canvas);
          //     resolve();
          //   };
          // });
        }
      }
      // console.log("2:" + _.now());

      let base64Data;
      // 2.调用第三方，html2canvas
      await html2canvas(gramDiv.value, {
        // 转换前预处理
        // onclone(html) {
        //   console.log(html);
        // },

        // 无需解析的节点，加快处理速度
        ignoreElements: (el) => {
          // console.log(el.cloneNode(true));
          const tagName = el.tagName.toLowerCase();
          if (Common.ignoreElements.includes(tagName)) return false;
        },
      }).then(function (canvas) {
        // 移除用于svg转换的canvas
        let removes = document.getElementsByClassName('copy-diagram-canvas');
        while (removes.length > 0) removes[0].remove();

        base64Data = canvas.toDataURL('image/png');
        // console.log("3:" + _.now());
      });

      // console.log(base64Data);
      return base64Data;
    };
    //#endregion

    const active = () => {
      compt.value.active();
      if (isPara.value) {
        rootClass.value = isOpen.value ? 'root-diagram-close' : 'root-diagram-open';
      }
    };
    const deActive = (hideCode, hideTb, altKey) => {
      compt.value.deActive(hideCode, hideTb, altKey);
      if (isPara.value) {
        rootClass.value = 'root-diagram';
      }
    };

    const isComptLoaded = ref(false);
    const comptLoaded = () => {
      // console.log("diagram-comptLoaded");
      isComptLoaded.value = true;
    };

    const lineLoaded = () => {};

    return {
      activeElement,
      actionTipContent,
      activeComponent,
      compt,
      focusedWordUnit,
      gramDiv,
      // historyManager,
      isLoaded,
      isOpen,
      isPara,
      loadCount,
      minWidth,
      rootClass,
      sentIds,
      showDiagram,
      showActionTip,
      tagger,
      type,
      xml,

      active,
      clear,
      clearLine,
      comptLoaded,
      deActive,
      decodeXml,
      diagram2Base64,
      encodeXml,
      computeComptMinWidth,
      gramClick,
      historyDecodeXml,
      lineLoaded,
      linePosition,
      redo,
      undo,
    };
  },

  methods: {
    onTouchMove(e) {
      e.preventDefault(); //阻止移动端屏幕滑动等事件
    },

    foldComponent(e, compt) {
      let grids = [];
      Common.traverseType(compt, GridCompt, grids);
      grids.forEach((o) => {
        if (o != compt && !o.belongIniType(XmlTags.O_Sent) && !o.isInStack) {
          o.isFold = true;
          o.foldComponent();
        }
      });

      let stacks = [];
      Common.traverseType(compt, StackCompt, stacks);
      stacks.forEach((o) => {
        if (o != compt && !o.belongIniType(XmlTags.O_Sent)) {
          // console.log(o);
          o.isFold = true;
          o.foldComponent();
        }
      });
    },

    unfoldComponent(e, compt) {
      let show = e == null || !e.ctrlKey;
      let grids = [];
      Common.traverseType(compt, GridCompt, grids);
      grids.forEach((o) => {
        if (o != compt && !o.belongIniType(XmlTags.O_Sent) && !o.isInStack) {
          // console.log(o);
          o.isFold = false;
          o.unfoldComponent(show);
        }
      });

      let stacks = [];
      Common.traverseType(compt, StackCompt, stacks);
      stacks.forEach((o) => {
        if (o != compt && !o.belongIniType(XmlTags.O_Sent)) {
          // console.log(o);
          o.isFold = false;
          o.unfoldComponent(show);
        }
      });
    },
  },
});
</script>
