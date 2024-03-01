<template>
  <div>base</div>
</template>

<script>
// import BaseCompt from './BaseCompt';
import UIElement from './UIElement.vue';
import SbjSep from './assist/SbjSep.vue';
import ObjSep from './assist/ObjSep.vue';
import WordFlag from './assist/WordFlag.vue';
import FillLifter from './assist/FillLifter.vue';

import XmlTags from '../api/xml_tags';
import ExprTags from '../api/expr_tags';
import PlugType from '../enum/plug_type';
import MovingType from '../enum/moving_type';
import SubSep from '../enum/sub_sep';
import RelationType from '../enum/relation_type';
import RelSubType from '../enum/relation_sub_type';
import GlobalConst from '../enum/global_variable';
import ExprConverter from '../api/expr_converter';
import Common from '../api/common';

import S_Key from '../enum/storage_key';
import LeaderLine from 'leader-line';
import { SessionStorage } from 'quasar';
import { ref, getCurrentInstance, computed, nextTick, watch, inject, onMounted, onBeforeUnmount } from 'vue';

export default {
  name: 'BaseCompt',
  extends: UIElement,
  props: {
    parentCompt: Object,
    text: String,
    xml: Element,
  },
  name: 'BaseCompt',
  setup(props, ctx) {
    const { proxy } = getCurrentInstance();
    const className = ref('drag-class');
    const align2Top = ref(true); // 是否向上依附句子，false时向下依附
    const moveEvent = ref(); // 鼠标事件
    const x = ref(0); // 拖动时，x移动距离
    const y = ref(0); // 拖动时，y移动距离
    const z = ref(0); // z-index
    const isLoaded = ref(false); // 成分是否加载完成

    const editor = inject(S_Key.JbwEditor);
    const diagramParentDiv = inject(S_Key.DiagramParentDiv);
    const activeComponent = inject(S_Key.ActiveComponent);
    const upActiveComponent = inject(S_Key.UpActiveComponent);
    const focusedWordUnit = inject(S_Key.FocusedWordUnit);
    const acMovingToolTip = inject(S_Key.AC_Moving_Tooltip);
    const acDragging = inject(S_Key.AC_Dragging);
    // 是否段落标注
    const isPara = computed(() => {
      return editor.value == null ? false : editor.value.isPara;
    });
    const diagram = computed(() => {
      return proxy.ancestor('Diagram');
    });
    const diagramEditable = computed(() => {
      return editor.value && editor.value.diagramEditable;
    });

    //#region  成分属性
    // 主句（最外层的小句或最外层复句中的小句）
    const isMainSent = computed(() => {
      let pCompt = props.parentCompt;
      return pCompt == null || (pCompt.$options.name == 'StackCompt' && pCompt.parentCompt == null);
    });
    // 当前成分所在的主句
    const mainSentCompt = computed(() => {
      return proxy.getTopComptByType('GridCompt');
    });
    // 位于复式结构中
    const isInStack = computed(() => {
      let pCompt = props.parentCompt;
      return pCompt != null && pCompt.belongType('StackCompt');
    });
    // 主句中的成分
    const isInMainLine = computed(() => {
      let pCompt = props.parentCompt;
      return pCompt != null && pCompt.isMainSent;
    });
    // 当前成分所属主干线成分（自身或祖先成分）
    const mainLineCompt = computed(() => {
      let compt = proxy;
      while (compt != null && !compt.isInMainLine) {
        compt = compt.parentCompt;
      }
      return compt;
    });
    // 位于定语，状语，补语，独立语中
    const isInBlock = computed(() => {
      let pCompt = props.parentCompt;
      return pCompt != null && pCompt.belongType('GridCompt', 'StackCompt') && pCompt.belongIniType(XmlTags.C_Sub);
    });
    const isOnlySbj = computed(() => {
      let pCompt = proxy.parentCompt;
      return (
        proxy.belongType('BaseCompt') &&
        proxy.belongIniType(XmlTags.C_Zhu) &&
        pCompt != null &&
        pCompt.childrenItems.every((o) => !o.belongIniType(XmlTags.C_Wei))
      );
    });
    // 是否是小句中第一个成分
    const isSentFirstCompt = () => {
      let isFirst = true;
      let pCompt = proxy.parentCompt;
      let msCompt = proxy.mainSentCompt;
      let temp = proxy;
      while (pCompt != null) {
        if (pCompt.childrenItems.firstOrDefault((o) => o.belongType('BaseCompt')) != temp) {
          isFirst = false;
          break;
        }
        if (pCompt == msCompt) break;
        temp = pCompt;
        pCompt = pCompt.parentCompt;
      }

      return isFirst;
    };
    // 是否是小句中最后一个成分
    const isSentLastCompt = () => {
      let isLast = true;
      let pCompt = proxy.parentCompt;
      let msCompt = proxy.mainSentCompt;
      let temp = proxy;
      while (pCompt != null) {
        if (pCompt.childrenItems.lastOrDefault((o) => o.belongType('BaseCompt')) != temp) {
          isLast = false;
          break;
        }
        if (pCompt == msCompt) break;
        temp = pCompt;
        pCompt = pCompt.parentCompt;
      }

      return isLast;
    };

    // 用于展示的iniType
    const iniType4Show = computed(() => {
      let st;
      if (props.iniType == XmlTags.O_Temp) st = props.parentCompt.iniType;
      else if ([XmlTags.V_Fun_COO1, XmlTags.V_Fun_UNI1].contains(props.iniType)) st = XmlTags.C_CC;
      else st = props.iniType;
      return st;
    });
    //#endregion

    onMounted(() => {
      // console.log(SessionStorage.getItem(S_Key.Com_Type));
      // console.log('base mounted')
      nextTick(() => {
        if (proxy.belongType('GridCompt') && isMainSent.value && isInStack.value) {
          // todo editor逻辑外移
          // let da = editor.value != null ? editor.value.diagramArea : null;
          let da = diagramParentDiv.value;
          // console.log(da);
          if (da != null) {
            // 标注区域滚动时，调整划线位置
            da.addEventListener('scroll', function (e) {
              // todo 后续如果把svg放到diagramParentDiv中，还需进一步细化水平、垂直滚动逻辑
              // if (lineSvg.value?.parentNode === da) {
              //   return;
              // }

              // console.log(e);
              if (line.value != null) {
                try {
                  // initialLineSandE();
                  line.value.position();
                } catch (error) {}
              }

              if (dependArc.value != null) {
                try {
                  // adjustArcStart(dependArc.value, dependCompt.value);
                  // initialArcStart();
                  dependArc.value.position();
                } catch (error) {}
              }

              relDivPosition();
            });
          }

          if (line.value == null && dependArc.value == null) {
            dependCompt.value = proxy;
            // _this.parentCompt.adjustArcPosition();
          }
        }
      });

      // 注册移动事件，判断是否移除标注区域
      document.addEventListener('mousemove', function (e) {
        proxy.moveEvent = e;
      });
      proxy.$el.addEventListener('touchmove', function (e) {
        proxy.moveEvent = e;
      });

      // if ("ontouchmove" in document) {
      //   proxy.$el.addEventListener("touchmove", function (e) {
      //     _this.moveEvent = e;
      //   });
      // } else {
      //   document.addEventListener("mousemove", function (e) {
      //     _this.moveEvent = e;
      //   });
      // }
    });

    onBeforeUnmount(() => {
      proxy.editable = false;
      isDragActived.value = false;
    });
    //#region 对齐/依存相关成分和线条
    let arrowAddSbj = false; // 对齐箭头成分时是否添加主语
    const line = ref(); // 与前一成分相连的线
    const lineX = ref(0); // 连接线相对左边的距离
    const lineY = ref(0); // 连接线相对上边的距离
    const lineZIndex = ref(1); // 连接线Z-Index
    const lineSvg = ref(); // line对应的svg元素
    const lineSvgArea = ref(); // line对应的svg area元素
    const _lineRel = ref(''); // "——" ……
    const relDiv = ref(); // 关系文字div，防止线条覆盖，置于最上层方便鼠标点击事件
    const subDiv = ref(); // 句间主从关系div
    const subRel = ref(''); // 句间主从关系
    const oriSubRel = ref(''); // 首次加载时的句间主从关系
    const topDiv = ref(); // 句间话题关系div
    const _topRel = ref(''); // 句间话题关系
    const oriTpcRel = ref(''); // 首次加载时的句间话题关系
    const lineRelation = computed(() => {
      return _lineRel.value;
    });
    const topicRelation = computed(() => {
      return _topRel.value;
    });
    const oriLineRelation = ref(''); // 首次加载时的句间关系
    // 初始oriLineRelation、oriSubRel优先级最高；
    // lineSet：是否线条初始化时的设置，用于加载默认关系
    // clickSet：是否弹窗手动点击设置
    const setLineRelation = async (rel, lineSet, clickSet = false) => {
      // if (process.env.NODE_ENV != "development") return;
      if (alignCompt.value == null && dependCompt.value == proxy) return;

      let defSub = RelSubType.ToTop;
      let tempRel; // 存储选择的关系，用于
      if (oriLineRelation.value != '' && oriLineRelation.value != '……') {
        rel = oriLineRelation.value;
        oriLineRelation.value = '';
      }
      // 加载默认关系
      else if (lineSet) {
        let type = matchComplexType();
        // console.log(type);
        if (type) {
          if (type.sub && type.sub != '') defSub = type.sub;
          rel = type.relation;
          if (type.topic != '') {
            _topRel.value = type.topic;
          }
        } else if (oriLineRelation.value == '……') {
          oriLineRelation.value = '';
          rel = RelationType.Default;
        }
      } else {
        tempRel = rel; // 存储手动选择的关系，用于判断sub
      }

      if (RelationType.TopicSym.includes(rel)) {
        _topRel.value = rel;
        // 承主、续宾不清空非“承接”关系，其他情况都清空
        if (_lineRel.value != '' && (!RelationType.Topic1Sym.includes(rel) || _lineRel.value == RelationType.Default)) {
          _lineRel.value = '';
        }
      } else {
        _lineRel.value = rel;
      }
      if (rel == GlobalConst.ZhanWei) {
        _topRel.value = '';
        _lineRel.value = '';
      }
      rel = _lineRel.value != '' ? _lineRel.value : '';

      if (oriTpcRel.value != '') {
        _topRel.value = oriTpcRel.value;
        oriTpcRel.value = '';
      }
      // 所有箭头上指下 todo 需先处理历史数据
      if (dependArc.value != null) {
        dependArc.value.startPlug = PlugType.Behind;
        dependArc.value.endPlug = PlugType.Behind;
        if (_topRel.value && _topRel.value == RelationType.ArrowSym && dependCompt.value) {
          if (dependCompt.value.row > props.row) dependArc.value.startPlug = PlugType.Arrow1;
          else dependArc.value.endPlug = PlugType.Arrow1;
        }
      }

      // console.log(rel);
      // 通过空白占位符生成svg>text节点，方便相关div定位
      let color = 'red';
      let fontSize = 16;
      if (alignCompt.value != null) {
        // console.log(rel, lineY.value, proxy.hLine.offsetTop);
        let ly =
          lineY.value < 0
            ? Math.abs(lineY.value) / 2 - proxy.$el.offsetHeight + proxy.hLine.offsetTop
            : lineY.value / 2 - proxy.hLine.offsetTop + 3;
        // todo 数值待优化
        if (isParentDivScroll()) {
          ly += 20;
        }
        // console.log(ly);
        // 向下对齐时，文字显示在Grid左上位置
        line.value.middleLabel = LeaderLine.captionLabel(GlobalConst.ZhanWei, {
          color: color,
          fontSize: fontSize,
          lineOffset: ly,
        });
      } else {
        dependArc.value.middleLabel = LeaderLine.captionLabel(GlobalConst.ZhanWei, {
          color: color,
          fontSize: fontSize,
        });
      }
      // _lineRel.value = rel;

      // if (process.env.NODE_ENV == "development") {
      // console.log(rel);

      if (topDiv.value == null) {
        let div = document.createElement('div');
        div.setAttribute('id', 'rel-div-top-' + proxy._.uid);
        div.setAttribute('oncontextmenu', 'return false');
        div.style.setProperty('z-index', lineZIndex.value + 101, 'important'); // 不能高于句间关系弹窗
        div.style.setProperty('position', 'absolute'); // fixed absolute
        div.style.setProperty('color', 'red'); // coral
        div.style.setProperty('cursor', 'pointer');
        div.style.setProperty('user-select', 'none');
        div.style.setProperty('font-size', '25px');
        div.style.setProperty('font-family', 'monospace');
        div.style.setProperty('background-color', 'transparent');
        document.body.append(div);
        topDiv.value = div;
      }

      if (subDiv.value == null) {
        let div = document.createElement('div');
        div.setAttribute('id', 'rel-div-sub-' + proxy._.uid);
        div.setAttribute('oncontextmenu', 'return false');
        div.style.setProperty('z-index', lineZIndex.value + 101, 'important'); // 不能高于句间关系弹窗
        div.style.setProperty('position', 'absolute'); // fixed absolute
        div.style.setProperty('color', 'red'); // coral
        div.style.setProperty('cursor', 'pointer');
        div.style.setProperty('user-select', 'none');
        div.style.setProperty('font-size', '25px');
        // div.style.setProperty("font-family", "monospace");
        div.style.setProperty('background-color', 'transparent');
        div.addEventListener('mouseup', subDivMouseUp);
        div.addEventListener('mouseenter', setRelTip);
        div.addEventListener('mouseleave', setRelTip);
        document.body.append(div);
        subDiv.value = div;
      }
      // 主从关系
      if (RelationType.MainSub.some((o) => rel.includes(o))) {
        if (clickSet) {
          let type = matchComplexType(tempRel, true);
          if (type && type.sub && type.sub != '') defSub = type.sub;
        }

        if (oriSubRel.value != '') {
          subRel.value = oriSubRel.value;
          oriSubRel.value = '';
        }
        // 主从指向
        else subRel.value = defSub;
      }
      // 非主从
      else {
        let temp = RelationType.RelSymDict[_lineRel.value];
        if (temp) {
          subRel.value = temp;
        } else {
          subDiv.value.remove();
          subDiv.value = null;
          subRel.value = '';
        }
      }
      // }

      if (oriRelBias.value != '') {
        setRelationBias(oriRelBias.value);
        oriRelBias.value = '';
      }

      relDivPosition();
      setLineTextNoSelect();
    };

    const topicContainRel = (rel) => {
      return RelationType.Topic.contains(rel) || /^\+续宾(\d+)$/.test(rel);
    };
    // 清空当前句间关系
    const clearRelation = () => {
      subRel.value = '';
      _lineRel.value = '';
      if (subDiv.value) subDiv.value.remove();
      subDiv.value = null;
      if (relDiv.value) relDiv.value.remove();
      relDiv.value = null;
      if (biasDiv.value) biasDiv.value.remove();
      biasDiv.value = null;
      if (topDiv.value) topDiv.value.remove();
      topDiv.value = null;
    };

    const biasDiv = ref(); // 关系偏误div
    const oriRelBias = ref(''); // 初始偏误信息
    const $relBias = ref('');
    const relBias = computed(() => {
      return $relBias.value;
    });
    // 设置关系偏误
    const setRelationBias = (bias) => {
      $relBias.value = bias;
      biasDiv.value.innerHTML = bias;
    };

    const endPlug = ref(''); // line对齐样式
    const iniEndPlug = ref(''); // 从XML加载时line对齐的初始样式
    watch(endPlug, (nv) => {
      if (line.value == null || nv == null) return;

      line.value.endPlug = nv;
      switch (nv) {
        case PlugType.Behind:
        case PlugType.Arrow1:
          line.value.endPlugSize = 1;
          line.value.endLabel = '';
          break;

        case PlugType.Disc:
          line.value.endPlugSize = 1.4;
          line.value.endLabel = LeaderLine.captionLabel('●', {
            fontSize: 15,
            offset: [-4.5, -14],
            color: 'white',
          });
          setLineTextNoSelect();
          break;

        case PlugType.ArrowD:
          line.value.endPlug = PlugType.Arrow1;
          line.value.endLabel = LeaderLine.captionLabel('➤', {
            fontSize: 20,
            offset: [-7, -57],
          });
          text = lineSvg.value.querySelector('text');
          // todo 多个text
          text.setAttribute('rotate', '90');
          text.style.setProperty('user-select', 'none');
          break;
      }
    });
    const alignCompt = ref(); // 缩进对齐的基准成分
    const hidAlignCompt = ref(); // 隐含的 缩进对齐的基准成分（用于判断对齐句首的情况）
    watch(alignCompt, (nv, ov) => {
      if (nv != null) {
        dependCompt.value = null;
        if (line.value != null) line.value.remove();
        let start = nv.isMainSent ? nv.hLine : nv.parentCompt.hLine;
        let lineVal = new LeaderLine(start, proxy.hLine);
        line.value = lineVal;
        initialLineSandE();
        // line.middleLabel = LeaderLine.captionLabel("MIDDLE");
        // line.size = "50";
        lineVal.color = 'black';

        lineVal.endPlug = PlugType.Behind; // endPlug.value可能不变，所以需初始化为Behind，
        if (iniEndPlug.value != null && iniEndPlug.value != '') {
          endPlug.value = iniEndPlug.value;
          iniEndPlug.value = null;
        }
        // // 对齐定语，且句首为空主语时，默认出箭头
        // else if (
        //   nv.belongIniType(XmlTags.C_Ding) &&
        //   proxy.childrenItems[0].belongIniType(XmlTags.C_Zhu) &&
        //   proxy.childrenItems[0].toXml().textContent == ""
        // )
        //   endPlug.value = PlugType.Arrow1;
        else endPlug.value = PlugType.Behind;

        lineVal.dash = true;
        lineVal.gradient = true;
        // lineVal.size = 2;

        setLeaderLineStyle(lineMouseUP);
        _lineRel.value = '';
        if (oriLineRelation.value != '') setLineRelation(oriLineRelation.value, true);
      } else if (line.value != null) {
        line.value.remove();
        line.value = null;
        lineX.value = 0;
        proxy.x = 0;
        lineSvg.value = null;
        lineSvgArea.value = null;
        endPlug.value = '';

        // proxy.aLineWidth = 0; // 谨慎设置，向前拖动x<0时会导致鼠标焦点偏移

        dependCompt.value = proxy;
      }
    });
    // 调整对齐线条的z-index顺序，越靠近对齐或依存成分的线条，z-index越大
    const adjustLineZIndex = () => {
      if (alignCompt.value == null && dependCompt.value == proxy) return;

      let gcs;
      let a2Top = alignCompt.value ? align2Top.value : dependCompt.value.row < proxy.row;
      // 查找对齐
      if (alignCompt.value) {
        let acSent = alignCompt.value.mainSentCompt;
        gcs = props.parentCompt
          .gridCompts()
          .filter(
            (o) =>
              ((a2Top && o.row >= acSent.row) || (!a2Top && o.row <= acSent.row)) && o.alignCompt == alignCompt.value
          );
      }
      // 查找依存
      else {
        let dcRow = dependCompt.value.row;
        gcs = props.parentCompt
          .gridCompts()
          .filter(
            (o) => ((a2Top && o.row >= dcRow) || (!a2Top && o.row <= dcRow)) && o.dependCompt == dependCompt.value
          );
      }

      if (gcs == null || gcs.length < 2) return;
      let z = lineZIndex.value;
      if (a2Top) gcs = gcs.reverse();
      gcs.forEach((gc) => {
        gc.lineSvg.style.setProperty('z-index', z, 'important');
        if (gc.lineSvgArea) gc.lineSvgArea.style.setProperty('z-index', z, 'important');
        z++;
      });
    };

    const lastAlignCompt = ref(); // 上一次对齐的成分
    const dependArc = ref(); // 依存弧线条
    const dependCompt = ref(); // 依存父节点
    const lineLoaded = ref(false); // 依存线条是否加载完成
    const dLineEndX = -7;
    watch(dependCompt, (nv, ov) => {
      // console.log(nv);

      // 依存于其他句
      if (nv != null && nv != proxy) {
        if (dependArc.value != null) dependArc.value.remove();

        let sLine = nv.hLine;
        let eLine = proxy.hLine;
        let { gravity, maxLeft } = calculateArcInfo(proxy, nv);
        if (props.parentCompt.marginLeft < maxLeft) proxy.updateParentItem('marginLeft', maxLeft);

        let lineVal = new LeaderLine(sLine, eLine);
        let ly = isParentDivScroll() ? getParentScrollOffsetTop() : 3;
        lineVal.start = LeaderLine.pointAnchor(sLine, {
          x: dLineEndX,
          y: ly,
        });
        lineVal.end = LeaderLine.pointAnchor(eLine, {
          x: dLineEndX,
          y: ly,
        });

        adjustArcStart(lineVal, dependCompt.value);

        lineVal.color = 'black';

        lineVal.dash = true;
        lineVal.gradient = true;
        lineVal.startSocket = 'left';
        lineVal.endSocket = 'left';
        lineVal.path = 'fluid';
        lineVal.startSocketGravity = gravity;
        lineVal.endSocketGravity = gravity;
        // lineVal.size = 2;

        dependArc.value = lineVal;
        nv.pointClass = 'align-line';

        setLeaderLineStyle(arcLineMouseUP);
        setLineRelation(GlobalConst.ZhanWei, true);

        nextTick(() => {
          lineLoaded.value = true;
        });
      } else if (dependArc.value != null) {
        dependArc.value.remove();
        dependArc.value = null;
      }

      // 依存于自身
      if (nv == proxy && dependArc.value == null) {
        // if (proxy.$el.nodeType != 1) return;

        // console.log(proxy.hLine, proxy.hLine.nodeType, proxy.$el, proxy.$el.nodeType);
        // console.log(proxy.layoutDiv, proxy.layoutDiv.nodeType);
        let line = new LeaderLine(proxy.hLine, dragVue.value.$el);
        let { maxLeft } = calculateArcInfo(proxy, nv);
        if (props.parentCompt.marginLeft < maxLeft) proxy.updateParentItem('marginLeft', maxLeft);

        dependArc.value = line;
        initialArcStart();

        dependArc.value.color = 'black';

        dependArc.value.dash = true;
        dependArc.value.gradient = true;
        dependArc.value.path = 'straight';
        // line.size = 2;
        // dependArc.value = line;
        setLeaderLineStyle(lineExpandGrid, true);

        clearRelation();
      }
    });
    const setDependArcInfo = (text) => {
      if (dependArc.value != null) dependArc.value.middleLabel = text;
    };

    const adjustArcStart = (dLine, dc) => {
      // console.log(dc);
      if (dc.alignCompt != null) {
        let sx = dc.x - dLineEndX;
        let sy = 2;
        if (isParentDivScroll()) {
          sy += getParentScrollOffsetTop();
        }
        // 虚线画法"stroke-dasharray: 8, 4" 所以长度取12的倍数，然后-2，长度不定可能会变为实线
        let sx1 = Math.ceil(sx / 12) * 12;
        let ex = sx - sx1 + 14; //    sx - ex == sx1 - 2
        let sLine = dc.hLine;
        // console.log(sLine.offsetTop);
        dLine.start = LeaderLine.areaAnchor(sLine, {
          // x: -nv.lineX,
          shape: 'polygon',
          points: [
            [-sx, sy],
            [-ex, sy],
            [-ex, sy],
          ],
          dash: true,
        });

        let svgs = document.querySelectorAll('.leader-line-areaAnchor');
        svgs.forEach((o) => {
          o.setAttribute('oncontextmenu', 'return false');
          o.style.setProperty('z-index', lineZIndex.value, 'important');
          // o.style.setProperty('position', 'fixed');
        });
        lineSvgArea.value = svgs[svgs.length - 1];
      }
    };

    // 初始化对齐线条起止点
    const initialLineSandE = () => {
      let ac = alignCompt.value;
      // console.log(ac);
      let pElLine, lx, ly;
      // 对齐到句首
      if (ac.isMainSent) {
        pElLine = ac.hLine;

        // 获取元素在视窗中的位置信息
        let rect1 = pElLine.getBoundingClientRect();
        let rect2 = proxy.hLine.getBoundingClientRect();
        // console.log(pElLine, rect1, window.innerHeight);
        // console.log(proxy.hLine, rect2, window.innerHeight);

        lx = -2;
        // 取对齐时成分相对于屏幕的位置，每次有一定误差
        ly = rect2.y - rect1.y - y.value + (align2Top.value ? 5 : -11);
        if (isParentDivScroll()) {
          ly += getParentScrollOffsetTop();
        }
      }
      // 对齐其他
      else {
        let acp = ac.parentCompt;
        pElLine = acp.hLine;
        let mainLine = proxy.hLine;
        let itemEl = ac.$el;
        let lineXVal = itemEl.offsetLeft + itemEl.offsetWidth - 3;
        // console.log(itemEl, itemEl.offsetLeft, itemEl.offsetWidth);
        if (acp.belongIniType(XmlTags.C_Bu)) {
          lineXVal -= acp.cornerCompt.$el.offsetWidth + 3;
        }
        let top = pElLine.offsetTop;
        // 递归计算y轴
        while (acp != null && !acp.isInMainLine) {
          top += acp.$el.offsetTop;
          acp = acp.parentCompt;
        }
        if (acp != null) {
          top += acp.$el.offsetTop;
          if (acp.isInMainLine && !acp.isMainSent) {
            top += acp.parentCompt.$el.offsetTop;
          }
        }

        lx = lineXVal;
        ly = proxy.$el.offsetTop - top + mainLine.offsetTop + 2;

        if (isParentDivScroll()) {
          ly += getParentScrollOffsetTop();
        }
      }
      lineX.value = lx;
      lineY.value = ly;

      let sy = isParentDivScroll() ? getParentScrollOffsetTop() : 0;
      // console.log(sy);
      line.value.start = LeaderLine.pointAnchor(pElLine, {
        x: lineX.value,
        y: sy,
      });
      line.value.end = LeaderLine.pointAnchor(pElLine, {
        x: lineX.value,
        y: lineY.value,
      });
    };
    // 设置线条样式和事件
    const setLeaderLineStyle = (mouseupFn, setCursor = false) => {
      let lls = document.getElementsByClassName('leader-line');
      if (lls.length > 0) {
        // 屏蔽右键弹窗，添加鼠标点击事件
        let ll = lls[lls.length - 1];
        lineSvg.value = ll;
        if (mouseupFn) {
          ll.setAttribute('oncontextmenu', 'return false');
          ll.style.setProperty('pointer-events', 'auto', 'important');
          if (setCursor) ll.style.setProperty('cursor', 'pointer');
          if (mouseupFn == lineMouseUP) ll.addEventListener('touchend', mouseupFn);
          ll.addEventListener('mouseup', mouseupFn);
        }

        if (dependCompt.value != proxy && biasDiv.value == null) {
          let div = document.createElement('div');
          div.setAttribute('id', 'rel-div-bias-' + proxy._.uid);
          div.setAttribute('oncontextmenu', 'return false');
          div.style.setProperty('z-index', lineZIndex.value + 100, 'important'); // 不能高于句间关系弹窗
          div.style.setProperty('position', 'absolute'); // fixed absolute
          div.style.setProperty('color', 'red'); // coral
          document.body.append(div);
          biasDiv.value = div;
        }

        if (dependCompt.value != proxy && relDiv.value == null) {
          let div = document.createElement('div');
          div.setAttribute('id', 'rel-div-' + proxy._.uid);
          div.setAttribute('oncontextmenu', 'return false');
          div.style.setProperty('z-index', lineZIndex.value + 100, 'important'); // 不能高于句间关系弹窗
          div.style.setProperty('position', 'absolute'); // fixed absolute
          div.style.setProperty('width', '18px');
          div.style.setProperty('height', '28px');

          if (diagramEditable.value) {
            div.style.setProperty('color', 'red');
            div.style.setProperty('background-color', 'rgb(211 211 211 / 50%)');
          } else {
            div.style.setProperty('color', 'transparent');
            div.style.setProperty('background-color', 'transparent');
          }
          // div.style.setProperty("opacity", "0.5");
          div.style.setProperty('font-size', '12px');
          div.style.setProperty('cursor', 'pointer');
          div.style.setProperty('writing-mode', 'vertical-rl');
          div.addEventListener('mouseup', relDivMouseUp);
          // div.addEventListener("mouseenter", setRelTip);
          // div.addEventListener("mouseleave", setRelTip);
          relDivPosition();
          document.body.append(div);
          relDiv.value = div;
        }

        // todo
        // ll.style.setProperty('z-index', lineZIndex.value, 'important');
        // 默认absolute会撑开document的滚动条，但改为fixed后document.scroll事件里无法调整画线位置；截图时，需要调整为fixed
        // ll.style.setProperty('position', 'fixed');
      }
    };

    // 句间关系提示
    const relationTip = ref(); // 句间关系提示tooltip
    const relationTipContent = ref(''); // 句间关系提示内容
    const relationTipTarget = ref(''); // 句间关系提示tooltip target
    const showRelationTip = ref(false); // 句间关系提示开关
    const setRelTip = () => {
      showRelationTip.value = !showRelationTip.value;

      if (showRelationTip.value) {
        let arr = _lineRel.value.split('+');
        // 取+前面部分    Topic2、Topic1则按大类处理
        let rel =
          arr[0] && arr[0] != ''
            ? arr[0]
            : RelationType.Topic2.contains(_lineRel.value)
            ? '解说'
            : RelationType.Topic1.contains(_lineRel.value)
            ? '顺承'
            : _lineRel.value;

        let type = matchComplexType(rel, true);
        if (type && type.example) {
          if (relationTip.value) {
            relationTipTarget.value = '#rel-div-' + proxy._.uid;
            // console.log(relationTipTarget.value);
          }
          relationTipContent.value = type.example;
        }
        // 没找到对应关系则不展示提示
        else showRelationTip.value = false;
      }

      if (!showRelationTip.value) relationTipTarget.value = '';
    };

    // 获取对应的复句关系    todo 优化匹配效率问题
    const matchComplexType = (rel, showTip = false) => {
      let t;
      let relGrid = alignCompt.value != null ? alignCompt.value.mainSentCompt : dependCompt.value.mainSentCompt;
      let topGrid = relGrid.row > props.row ? proxy : relGrid;
      let tgXml = topGrid.toXml();
      let topText = tgXml.textContent;
      let bottomGrid = relGrid.row > props.row ? relGrid : proxy;

      let sbj = topGrid.childrenItems.firstOrDefault((o) => o.belongIniType(XmlTags.C_Zhu));
      // 针对弧线，如果前一句是独词句，且没有标注关系时
      // todo 独词词性为体词
      if (!rel && sbj && sbj.isOnlySbj && !topText.endsWith('”') && dependCompt.value) {
        let bottomSbj = bottomGrid.childrenItems.firstOrDefault((o) => o.belongIniType(XmlTags.C_Zhu));
        // 前后都为独词，则为并列
        let rel = bottomSbj && bottomSbj.isOnlySbj ? '并列' : '';
        t = { relation: rel };
      } else if (topText != '') {
        let ctypes = SessionStorage.getItem(S_Key.Com_Type);
        if (!ctypes) return;
        if (!showTip) ctypes = ctypes.filter((o) => o.state == 0);
        let types = rel ? ctypes.filter((o) => o.relation == rel) : ctypes;
        let punc = /[“”，？！。‘’—…；、\-（）]/g; // 注：不能包含正则元字符中会出现的标点
        let topExpr;
        // let topExpr = ExprConverter.toLinearExpr(tgXml).replace(punc, "");
        // 取第一层剪枝后的表达式
        let exprs1 = ExprConverter.getAllClauseExprs(tgXml);
        for (const key in exprs1) {
          if (Object.hasOwnProperty.call(exprs1, key)) {
            const element = exprs1[key];
            topExpr = element.length > 1 ? element[1] : ExprConverter.toLinearExpr(tgXml);
            break;
          }
        }

        let bgXml = bottomGrid.toXml();
        let bottomExpr;
        // let bottomExpr = ExprConverter.toLinearExpr(bgXml).replace(punc, "");
        // 取第一层剪枝后的表达式
        let exprs2 = ExprConverter.getAllClauseExprs(bgXml);
        for (const key in exprs2) {
          if (Object.hasOwnProperty.call(exprs2, key)) {
            const element = exprs2[key];
            bottomExpr = element.length > 1 ? element[1] : ExprConverter.toLinearExpr(bgXml);
            break;
          }
        }
        // console.log(topExpr);
        // console.log(types);
        let synAllReg = new RegExp('[' + ExprTags.Syn_All + ']', 'g');
        for (let i = 0; i < types.length; i++) {
          const type = types[i];
          // 句式表达式正则匹配 和 原文正则匹配
          let m = 0;
          if (type.prevExpr != '') {
            let topIn = type.prevExpr.match(synAllReg) ? topExpr : topText;
            if (!type.prevExpr.match(punc)) topIn = topIn.replace(punc, '');
            // let topIn = topText;
            let rm = topIn.match(new RegExp(type.prevExpr));
            if (rm) {
              // for (let j = 1; j < rm.length; j++) {
              //   const element = rm[j] ? rm[j] : "";
              //   type.example = type.example.replace('p'+ j, element)
              // }
              type.example = type.example.replace('p', rm[0]).replace(synAllReg, '');
              m++;
            }
            // 正则未匹配，但勾选可有可无
            else if (type.prevOpt == 1) {
              type.example = type.example.replace('p', '');
              m++;
            }
          } else m++;

          if (type.nextExpr != '') {
            let bottomIn = type.nextExpr.match(synAllReg) ? bottomExpr : bgXml.textContent;
            if (!type.nextExpr.match(punc)) bottomIn = bottomIn.replace(punc, '');
            // let bottomIn = bgXml.textContent;

            // console.log("bottomIn:", bottomIn);
            // console.log("nextExpr:", type.nextExpr);
            let rm = bottomIn.match(new RegExp(type.nextExpr));
            if (rm) {
              // for (let j = 1; j < rm.length; j++) {
              //   const element = rm[j] ? rm[j] : "";
              //   type.example = type.example.replace('n'+ j, element)
              // }
              type.example = type.example.replace('n', rm[0]).replace(synAllReg, '');
              m++;
            }
            // 正则未匹配成功，但勾选可有可无
            else if (type.nextOpt == 1) {
              type.example = type.example.replace('n', '');
              m++;
            }
          } else m++;

          if (m == 2) {
            t = type;
            break;
          }
        }

        // 相同谓语 并列
        // relation example
        if (!t && (!rel || rel == '并列' || _lineRel.value == '+接句')) {
          let prd1 = topGrid.childrenItems.find((o) => o.belongIniType(XmlTags.C_Wei));
          let prd2 = bottomGrid.childrenItems.find((o) => o.belongIniType(XmlTags.C_Wei));
          if (prd1 && prd2) {
            let prd1txt = prd1.text.replace(/[“”‘’，\s]/g, '');
            let prd2txt = prd2.text.replace(/[“”‘’，\s]/g, '');
            if (prd1txt == prd2txt)
              t = {
                relation: '并列',
                example: '…' + prd1txt + '…，…' + prd2txt + '…',
              };
          }

          // 限制：不能对齐到其他句
          // if (!t && !bottomGrid.alignCompt && (!topGrid.alignCompt || topGrid.alignCompt.mainSentCompt != bottomGrid)) {
          //   let sbj2 = bottomGrid.childrenItems.find(o => o.belongIniType(XmlTags.C_Zhu));
          //   if (sbj2 && sbj2.text == "这") t = { relation: "+接句", example: "…，这…" };
          // }
        }
      }

      return t;
    };

    // 调整连接线位置、调整成分距离左边线的位置
    const position = () => {
      if (line.value == null) return;

      if (alignCompt.value != null && alignCompt.value._isDestroyed) {
        alignCompt.value = null;
        x.value = 0;
        return;
      }

      try {
        line.value.position();
        relDivPosition();
      } catch (error) {
        console.error(error);
        return;
      }

      // 对齐到句首
      if (alignCompt.value != null && alignCompt.value.isMainSent) {
        x.value = alignCompt.value.x;
        proxy.aLineWidth = alignCompt.value.aLineWidth;
      }
      // 对齐到其他
      else if (alignCompt.value != null && alignCompt.value.parentCompt != null) {
        let tx = 4;
        let ac = alignCompt.value;
        let acp = ac.parentCompt;
        initialLineSandE();

        // 递归查找计算偏移量   主句偏移x + 成分偏移（父成分+自身）
        if (alignCompt.value.isInMainLine) tx += acp.x + lineX.value - 2;
        else {
          let temp = acp;
          while (temp != null && !temp.isInMainLine) {
            tx += temp.$el.offsetLeft + 1;
            temp = temp.parentCompt;
          }
          tx += temp.parentCompt.x + temp.$el.offsetLeft + lineX.value - 1;
          if (acp.belongIniType(XmlTags.C_Bu)) tx += acp.cornerCompt.$el.offsetWidth + 4;
        }
        x.value = tx;

        let mx = 3;
        // 最外层主语
        if (ac.belongIniType(XmlTags.C_Zhu, XmlTags.C_FF, XmlTags.C_UN)) {
          let acr = ac.nearestRightElem();
          if (acr != null && acr.belongType(SbjSep)) {
            mx += 20; //SbjSep的宽度
            let sr = acr.nearestRightElem();
            if (sr != null && sr.belongType(FillLifter)) mx += 13;
          }
        }
        // 顶起主语里面末尾的成分
        else if (ac == acp.childrenItems.lastOrDefault() && ac.getTopComptByIniType(XmlTags.C_Zhu) != null) {
          mx += 3; //顶起Lifter则+3
          // todo 还差顶起stack计算
          while (acp.parentCompt != null && acp.parentCompt.childrenItems.lastOrDefault() == acp) {
            mx += 3;
            acp = acp.parentCompt;
          }
          mx += 20; //SbjSep的宽度
        }
        // 对齐谓语
        else if (ac.belongIniType(XmlTags.C_Wei)) {
          let acr = ac.nearestRightElem();
          if (acr != null && acr.belongType('ObjSep')) {
            mx += 15; //ObjSep的宽度
          } else if (acr != null && acr.belongIniType(XmlTags.Prd_Fun)) {
            mx += 13; //谓语后PrdSep的宽度
          }
        }
        // 对齐宾语
        else if (ac.belongIniType(XmlTags.C_Bin)) {
          let acr = ac.nearestRightElem();
          if (acr != null && acr.belongIniType(XmlTags.Prd_Fun)) {
            mx += 23; //宾语后PrdSep的宽度
          }
        }
        // console.log(mx);
        proxy.aLineWidth = mx;
      }

      // todo 优化lineLoaded逻辑
      setTimeout(() => {
        lineLoaded.value = true;
      }, 20);

      arcPosition(true);
    };

    // 右键对齐线转换
    const lineMouseUP = (e) => {
      // console.log(e);
      let ac = alignCompt.value;
      // 右键切换衔接类型
      if (line.value == null || (e.button != 2 && e.type == 'mouseup') || ac == null || !proxy.editable) return;

      changePlug1(ac);
      // // 转箭头添加主语
      // if (endPlug.value == PlugType.Arrow1) {
      //   addEmptySbj();
      // }
      line.value.position();
      relDivPosition();
    };

    const changePlug0 = (ac) => {
      // 1.虚线转箭头
      if (line.value.endPlug == PlugType.Behind) {
        // 向下对齐时，过了主语时则不能出箭头/圈  todo 无主句限制
        if (!align2Top.value && ac.mainLineCompt.leftElems().some((o) => o.belongType(SbjSep))) return;

        // 独词句对齐时，不能出箭头，末尾可出圈
        let sbj = proxy.childrenItems.firstOrDefault((o) => o.belongIniType(XmlTags.C_Zhu));
        if (sbj != null && sbj.isOnlySbj) {
          if (ac.isSentLastCompt()) {
            endPlug.value = PlugType.Disc;
          }
          return;
        }

        endPlug.value = PlugType.Arrow1;
      }
      // 2. 2.1对齐末位时，arrow1转双箭头，双箭头转圆点； 2.2其他arrow1转behind
      else if (line.value.endPlug == PlugType.Arrow1) {
        if (ac.isSentLastCompt()) endPlug.value = PlugType.Disc;
        else endPlug.value = PlugType.Behind;
      }
      // 3.圆点或其他转虚线
      else {
        endPlug.value = PlugType.Behind;
      }
    };

    const changePlug1 = (ac) => {
      // 1.虚线转圆圈
      if (line.value.endPlug == PlugType.Behind) {
        // 对齐上句末尾时，才出圆圈
        if (align2Top.value) {
          if (ac.isSentLastCompt()) {
            endPlug.value = PlugType.Disc;
            setLineRelation(GlobalConst.ZhanWei);
          } else if (ac.isMainSent) {
            while (ac.isMainSent) {
              ac = ac.alignCompt;
            }
            if (ac.isSentLastCompt()) {
              endPlug.value = PlugType.Disc;
              setLineRelation(GlobalConst.ZhanWei);
            }
          }
        }
      }
      // 2.圆点或其他转虚线
      else {
        endPlug.value = PlugType.Behind;
      }
    };

    // 句子展开/收起
    const lineExpandGrid = (e) => {
      if (dependArc.value == null || dependCompt.value == null || !proxy.editable || e.button != 0 || !isPara.value)
        return;

      proxy.expandGrid();
    };

    // 调整根节点线条长度    todo 待优化，会加载多次
    const initialArcStart = (ml) => {
      if (dependArc.value == null || dependCompt.value != proxy || !document.body.contains(proxy.hLine)) return;
      if (ml == null) ml = props.parentCompt.marginLeft;
      let x = ml < GlobalConst.ArcMarginLeft ? -35 : -ml - 5;
      // console.log(ml, proxy.hLine);
      let y = 2 + (isParentDivScroll() ? getParentScrollOffsetTop() : 0);
      dependArc.value.start = LeaderLine.pointAnchor(proxy.hLine, {
        x: x,
        y: y,
      });
      dependArc.value.end = LeaderLine.pointAnchor(proxy.hLine, {
        x: -15,
        y: y,
      });

      nextTick(() => {
        dependArc.value.position();
        relDivPosition();
        lineLoaded.value = true;
      });
    };
    // 调整依存弧弧度
    const adjustArcGravity = () => {
      if (dependArc.value == null || dependCompt.value == proxy || !document.body.contains(proxy.hLine)) return;

      let info = calculateArcInfo(proxy, dependCompt.value);
      dependArc.value.startSocketGravity = info.gravity;
      dependArc.value.endSocketGravity = info.gravity;

      adjustArcStart(dependArc.value, dependCompt.value);

      nextTick(() => {
        dependArc.value.position();
        relDivPosition();
        lineLoaded.value = true;
      });
      return info.maxLeft;
    };
    // 调整依存弧位置
    const arcPosition = (remove) => {
      if (props.parentCompt == null) return;

      let gcs = props.parentCompt.gridCompts();
      if (gcs == null || gcs.length == 0) return;

      // todo 逻辑调整  有对齐成分的句子，可以有指向自身的句子20220407
      // if (remove)
      //   gcs.forEach(o => {
      //     // 有对齐成分的句子，清除自身指向句子的节点
      //     if ((o == proxy || o.dependCompt == proxy) && o.dependArc != null) {
      //       o.dependCompt = null;
      //     }
      //   });

      // 清除跨线句子
      if (dependCompt.value == null) {
        gcs.forEach((o) => {
          if (o.alignCompt != null && !canAlign(o, o.alignCompt)) {
            o.alignCompt = null;
            o.aLineWidth = 0;
            o.x = 0;
          }
        });
      }

      if (proxy.pointClass == 'align-line-check') proxy.pointClass = 'align-line';

      if (dependArc.value != null) {
        try {
          dependArc.value.position();
          relDivPosition();
        } catch (error) {
          console.log(error);
        }
      }

      // console.log("arcPosition");
    };
    // 右键移除依存弧
    const arcLineMouseUP = (e) => {
      if (
        dependArc.value == null ||
        (e.button != 2 && e.type == 'mouseup') ||
        dependCompt.value == null ||
        !proxy.editable
      )
        return;

      dependCompt.value = proxy;
      nextTick(() => {
        arcPosition();
        props.parentCompt.adjustAllArcPoint();
      });
    };
    // 点击句间关系焦点div
    const relDivMouseUp = async (e) => {
      if (!proxy.editable || !e) return;

      if (e.button == 2) {
        setLineRelation(GlobalConst.ZhanWei);
        return;
      }

      editor.value.showRelation = false;
      await nextTick();

      editor.value.showRelation = true;
      editor.value.srMouseEvent = e;
      editor.value.relationGrid = proxy;
      e.stopPropagation();
    };
    // 句子主从关系转换
    const subDivMouseUp = () => {
      if (!proxy.editable) return;

      if (subDiv.value == null) return;

      if (subRel.value == RelSubType.ToTop || subRel.value == RelSubType.ToBottom) {
        subRel.value = subRel.value == RelSubType.ToTop ? RelSubType.ToBottom : RelSubType.ToTop;
      }
    };
    watch(subRel, (nv) => {
      // console.log(nv);
      if (subDiv.value != null) subDiv.value.textContent = nv;
    });
    watch(_topRel, (nv) => {
      // console.log(nv);
      if (topDiv.value != null) {
        topDiv.value.textContent = nv != RelationType.ArrowSym ? nv : '';
      }
    });

    // 随着line位置变化调整句间关系焦点div的位置
    const relDivPosition = () => {
      nextTick(() => {
        if (relDiv.value != null && lineSvg.value != null) {
          let array = lineSvg.value.getElementsByTagName('text');
          for (let i = 0; i < array.length; i++) {
            const o = array[i];
            // 排除带●的情况
            if (o.innerHTML != '●') {
              let ty = parseInt(o.getAttribute('y').replace('px', ''));
              let tx = parseInt(o.getAttribute('x').replace('px', ''));
              let tw = parseInt(o.getBBox().width);

              // 空白占位的情况
              if (tw == 0) {
                // tx -= 13;
                tw = 31;
              }

              let sleft = tx + tw - 25;
              let tLeft = tx - 27;
              relDiv.value.style.setProperty('left', tx - 9 + 'px');
              relDiv.value.style.setProperty('top', ty - 12 + 'px');
              // relDiv.value.style.setProperty("width", tw + "px");
              relDiv.value.textContent = _lineRel.value;
              if (subDiv.value != null) {
                subDiv.value.style.setProperty('left', sleft + 'px');
                subDiv.value.style.setProperty('top', ty - 20 + 'px');
              }
              if (topDiv.value != null) {
                topDiv.value.style.setProperty('left', tLeft + 'px');
                topDiv.value.style.setProperty('top', ty - 20 + 'px');
              }
              if (biasDiv.value != null) {
                biasDiv.value.style.setProperty('left', tx + tw + 3 + 'px');
                biasDiv.value.style.setProperty('top', ty - 14 + 'px');
              }
            }
          }
        }
      });
    };
    // 连接线文字不可选中
    const setLineTextNoSelect = () => {
      if (lineSvg.value) {
        let array = lineSvg.value.getElementsByTagName('text');
        for (let i = 0; i < array.length; i++) {
          const o = array[i];
          o.style.setProperty('user-select', 'none');
        }
      }
    };
    const setRelDivVisible = (visible = false, altKey = false) => {
      if (visible && relDiv.value) {
        relDiv.value.style.setProperty('color', 'red');
        relDiv.value.style.setProperty('background-color', 'rgb(211 211 211 / 50%)');
      } else if (relDiv.value) {
        if (altKey) {
          relDiv.value.style.setProperty('color', 'transparent');
          relDiv.value.style.setProperty('background-color', 'transparent');
        } else {
          relDiv.value.style.setProperty('color', 'red');
          relDiv.value.style.setProperty('background-color', _lineRel.value == '' ? 'transparent' : 'white');
        }
      }
    };
    //#endregion

    //#region 光标位置和div位置
    // Diagram外层div是否有垂直滚动条
    const isParentDivScroll = () => {
      return diagramParentDiv.value && diagramParentDiv.value.scrollHeight > diagramParentDiv.value.clientHeight;
    };
    const getParentScrollOffsetTop = () => {
      return diagramParentDiv.value.scrollTop - diagramParentDiv.value.offsetTop;
    };

    // 获取光标相对于div左上角的位置
    const getCursorPosition = (div) => {
      if (div == null) return;

      let p = getPosition(div);
      if (p == null) return;

      let { clientX, clientY } = getMoveClient();
      // 鼠标位置 - 元素绝对位置
      let x = clientX - p.x;
      let y = clientY - p.y;

      // console.log("c:" + x + "\t" + y);
      return { x, y };
    };

    // 获取diagramArea中的div相对于左上角的绝对位置，考虑滚动条偏移和拖动偏移
    const getPosition = (div) => {
      if (!div) return;
      if (!diagram.value) return;

      let da = diagramParentDiv.value;
      if (da == null) return;

      let html = document.body.parentNode;
      if (html == null) return;

      let grid = div.ancestor('GridCompt');
      let main = grid == null ? null : grid.getTopComptByType('GridCompt');
      let point = Common.getPosition(div);
      let offsetX = main != null ? main.x : props.parentCompt != null ? props.parentCompt.x : 0;
      // 元素相对位置 - 图形滚动条 - 窗口滚动条
      let x = point.left - da.scrollLeft - html.scrollLeft + offsetX;
      let y = point.top - da.scrollTop - html.scrollTop;

      // console.log(div);
      // console.log("p:" + x + "\t" + y);
      return { x, y };
    };

    // 获取光标相对于左上角的绝对位置，考虑滚动条偏移
    const getMoveClient = () => {
      let clientX = 0,
        clientY = 0;
      let e = moveEvent.value;
      if (e == null) return { clientX, clientY };

      // 移动端
      if (e.type == 'touchmove') {
        let touch = e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      // console.log("m:" + clientX + "\t" + clientY);
      return { clientX, clientY };
    };

    // 是否超过Diagram的边界
    const isOutDiagramBorder = () => {
      if (diagram.value == null) return false;

      let div = diagram.value.gramDiv;
      if (div == null) return false;

      let e = moveEvent.value;
      if (e == null) return false;

      let p = getCursorPosition(div);
      if (p == null) return false;
      // 考虑拖动偏移量
      let mx = p.x + (props.parentCompt != null ? props.parentCompt.x : 0),
        my = p.y;
      // console.log("mx:" + mx + "\tmy:" + my + "\tw:" + div.offsetWidth + "\th:" + div.offsetHeight);
      // 主句上的小句只能上下删除，左右拖动用于标注句间关系
      if (proxy.belongType('GridCompt') && isMainSent.value && isInStack.value) {
        let isOut = my < 0 || my > div.offsetHeight;
        // 非句不能对齐到其它句子
        if (proxy.ignore) return isOut;

        // 获取元素的transform属性
        let translates = document.defaultView.getComputedStyle(proxy.$el).transform;
        // 解析X轴数值
        let translateX = parseFloat(translates.substring(6).split(',')[4]);

        let rIdx = proxy.row == 1 || e.shiftKey || !align2Top.value ? 1 : -1;
        let tgRow = proxy.row + rIdx;
        let grids = props.parentCompt.gridCompts();
        let nearGrid = grids.find((o) => o.row == tgRow);
        let ac;
        while (nearGrid != null) {
          let items = nearGrid.childrenItems;
          items.forEach((o) => {
            if (o.belongType('BaseCompt')) {
              let el = o.$el;
              if (translateX > el.offsetLeft + nearGrid.x && translateX < el.offsetLeft + nearGrid.x + el.offsetWidth)
                ac = o;
            }
          });
          if (ac != null) break;

          tgRow += rIdx;
          nearGrid = grids.find((o) => o.row == tgRow);
        }

        // 查找需要对齐到TextCompt
        let tcp = ac != null ? ac.parentCompt : null;
        // 按整体处理的类型，需要和GridCompt中fromXml里面的一致
        let bTypes = [XmlTags.C_Ding, XmlTags.C_Ind, XmlTags.C_Zhu];
        if (ac != null && !ac.belongType('TextCompt') && !ac.belongIniType(bTypes)) {
          let temp = null;
          let tcs = [];
          Common.traverseType(ac, 'TextCompt', tcs);
          for (let i = 0; i < tcs.length; i++) {
            let tc = tcs[i];
            let anc = tc.getTopComptByIniType(bTypes);
            if (anc != null) {
              tc = anc;
            }
            tcp = tc.parentCompt;
            // 复式结构中取最下层文本框
            if (tcp.isInStack && tcp.row != tcp.parentCompt.gridCompts().length) continue;
            let tcOffsetLeft = tc.$el.offsetLeft;
            while (tcp != null && !tcp.isInMainLine) {
              tcOffsetLeft += tcp.$el.offsetLeft;
              tcp = tcp.parentCompt;
            }
            if (
              translateX > tcOffsetLeft + ac.$el.offsetLeft + nearGrid.x &&
              translateX < tcOffsetLeft + ac.$el.offsetLeft + nearGrid.x + tc.$el.offsetWidth
            ) {
              temp = tc;
              break;
            }

            if (temp != null) break;
          }

          // 可对齐到状语开头介词TextCompt
          if (ac.belongIniType(XmlTags.C_Zhuang)) {
            if (temp && !temp.nearestLeftCompt() && temp.belongIniType(XmlTags.C_PP)) {
              ac = temp;
            }
          } else ac = temp;
        }

        let hidAc;
        if (tcp && Math.abs(tcp.row - proxy.row) > 1) {
          let s;
          let e;
          let i;
          if (align2Top.value) {
            s = proxy.row - 1;
            e = tcp.row;
            i = -1;
          } else {
            s = proxy.row + 1;
            e = tcp.row;
            i = 1;
          }

          while (((s > e && i < 0) || (s < e && i > 0)) && s != e) {
            const preAlign = grids.find((o) => o.row == s);
            // 对齐到所有对齐到同一成分句子中最近一句的句首
            if (preAlign && preAlign.hidAlignCompt == ac) {
              hidAc = ac;
              ac = preAlign;
              break;
            }

            s += i;
          }
        }

        // console.log(ac);
        if ((proxy.x < 0 && ac == null) || canAlign(proxy, ac)) {
          endPlug.value = null; // 清除原先结尾样式
          alignCompt.value = ac;
          hidAlignCompt.value = hidAc ? hidAc : ac;

          // 对齐最后一个成分且为箭头时，向后拖动时补充空主语
          // if (
          //   !arrowAddSbj &&
          //   line.value != null &&
          //   line.value.endPlug == PlugType.Arrow1 &&
          //   ac != null &&
          //   ac.isSentLastCompt()
          // ) {
          //   addEmptySbj();
          // }
        }

        return isOut;
      }

      return mx < 0 || my < 0 || mx > div.offsetWidth || my > div.offsetHeight;
    };

    const showActionTip = ref(false); // 是否展示提示框
    const actionTipContent = ref(''); // 提示框文字内容
    watch(actionTipContent, (nv) => {
      // console.log(nv);
      if (nv == MovingType.Merge) className.value = 'drag-merge-class';
      else if (nv == MovingType.Convert) className.value = 'drag-transfer-class';
      else if (nv == MovingType.Delete || nv == MovingType.Sent) className.value = 'drag-del-class';
      else if (nv == MovingType.Align) className.value = 'drag-move-class';
      else className.value = 'drag-active-class';
    });
    // 拖动和放开后的执行相应的操作 act=true表示放开后执行后续的方法
    const moveAction = (x, y, act = true) => {
      let content = MovingType.Move;
      let editorVal = editor.value;
      let targetCompt = null;
      // console.log('moveAction', x, y);
      // 1. 拖动删除逻辑，
      if ((Math.abs(x) > 5 || Math.abs(y) > 5) /* 防止点击切分窗口时，鼠标在gramDiv外面 */ && isOutDiagramBorder()) {
        content = MovingType.Delete;
        let compt = proxy.belongIniType(XmlTags.O_Temp) ? proxy.parentCompt : proxy;
        let pCompt = compt.parentCompt;
        if ((pCompt != null && pCompt.isMainSent) || compt.isSentFirstCompt() || compt.isSentLastCompt()) {
          let text = compt.toXml().textContent;
          let mText = compt.mainSentCompt.toXml().textContent;
          // todo：待完善，拖动中间成分内容如果和开始、结束本文相同则会出现误判
          if (text != '' && (mText.startsWith(text) || mText.endsWith(text))) content = MovingType.Sent;
        }

        if (act) {
          if (editorVal != null) editorVal.deleteComponent(moveEvent.value);
          if (line.value != null) line.value.remove();
        }
      }
      // 2. 其他逻辑
      else if (Math.abs(x) > 5 || Math.abs(y) > 5) {
        // 拖动Generic则向上查找父级GridCompt
        let compt = proxy.belongIniType(XmlTags.O_Temp) ? proxy.parentCompt : proxy;
        let pCompt = compt.parentCompt;
        if (pCompt == null) return { content, targetCompt };
        let div = pCompt.$el;
        if (div == null) return { content, targetCompt };
        let p = getCursorPosition(div);
        // console.log(pCompt, div, p);
        if (p == null) return { content, targetCompt };

        let divX = p.x,
          divY = p.y;

        // console.log("divX:" + divX + "\tdivY:" + divY + "\tw:" + div.offsetWidth + "\th:" + div.offsetHeight);
        let items = pCompt.childrenItems;
        let tarRow = 0;
        let tarCol = 0;
        items.forEach((o) => {
          if (o.belongType && o.belongType('BaseCompt', WordFlag, FillLifter)) {
            let el = o.$el;
            // console.log("l:" + el.offsetLeft + "\tw:" + el.offsetWidth);
            let x = divX > el.offsetLeft && divX < el.offsetLeft + el.offsetWidth;
            let y = divY > el.offsetTop && divY < el.offsetTop + el.offsetHeight;
            if (x) tarCol = o.column;
            if (y) tarRow = o.row;
          }
        });
        targetCompt = items.find((o) => o.column == tarCol && o.row == tarRow && o.belongType('BaseCompt'));
        // 2.1 合并操作
        if (targetCompt && targetCompt != compt) {
          content = MovingType.Merge;
          // if (act) {
          //   // 段落标注限制，不允许跨整句合并
          //   if (compt.sentId > 0 && compt.sentId != targetCompt.sentId) {
          //     proxy.qAlert('合并失败：整句不能作为句子成分！');
          //     return content;
          //   }

          //   let mergeFn = proxy.SentBuilder.mergeComponent(compt, targetCompt);
          //   mergeFn.then(() => {
          //     if (line.value != null) line.value.remove();
          //     editorVal.linePosition();
          //     editorVal.clearActiveCompt(true);
          //   });
          // }
        }
        // 2.2 上下拖动成分，进行成分转换
        else if (
          targetCompt == null &&
          !compt.belongIniType(XmlTags.O_Sent) &&
          Math.abs(tarRow - compt.row) == 2 &&
          tarCol == compt.column
        ) {
          content = MovingType.Convert;
          if (act) {
            proxy.SentBuilder.changeComponent(compt, tarRow, tarCol);
            if (editorVal) editorVal.linePosition();
          }
        }
        // 2.3 对齐后处理 主句向后拖动，考虑删除空主语
        else if (line.value != null && alignCompt.value != null && proxy.alignCompt.parentCompt != null) {
          content = MovingType.Align;

          if (act) {
            let ac = alignCompt.value;
            // 箭头且对齐最后一个成分时不删空主语，其他情况都删除
            if (line.value.endPlug != PlugType.Arrow1 || ac.belongIniType(XmlTags.C_Ding)) {
              let first = proxy.childrenItems.firstOrDefault((o) => o.belongIniType(XmlTags.C_Zhu));
              if (first != null && !first.isOnlySbj && first.toXml().textContent == '') {
                proxy.SentBuilder.deleteComponent(first);

                // 把对齐空主语的句子对齐到当前句的句首
                proxy.parentCompt.childrenItems.forEach((o) => {
                  if (o.alignCompt == first) {
                    // 保留原有句间关系
                    o.oriLineRelation = o.lineRelation;
                    o.alignCompt = proxy;
                  }
                });
              }
            }

            if (editorVal != null && lastAlignCompt.value != alignCompt.value) editorVal.isSaved = false;
          }
        }
        // 2.4 向左拖动时添加空主语
        else if (isMainSent.value && alignCompt.value == null && x < 0) {
          if (act) {
            addEmptySbj();
          }
        }
      }

      return { content, targetCompt };
    };

    // 判断是否能够对齐
    const canAlign = (compt, alignCompt) => {
      if (compt == null || alignCompt == null || compt.lineSvg == null) return false;

      let gcs = compt.parentCompt.gridCompts();
      if (gcs == null || gcs.length <= 1) return false;

      let acTop = alignCompt.getTopComptByType('GridCompt');
      // 1、不能对齐到非句
      if (acTop == null || acTop.ignore) return false;

      // 不能跨句
      if (acTop.sentId != compt.sentId) return false;

      let topAc = acTop.alignCompt;
      // 2、不能互相指向
      if (topAc != null && topAc.getTopComptByType('GridCompt') == compt) return false;

      let min = Math.min(compt.row, acTop.row);
      let max = Math.max(compt.row, acTop.row);
      let middles = gcs.filter((o) => o.row > min && o.row < max);
      // 3、中间不能有不对齐的句子
      if (middles.some((o) => o.dependCompt == o || o.alignCompt == null)) return false;

      // 4、对齐到联合连词时，必须有文本
      if (alignCompt.belongIniType(XmlTags.V_Fun_APP, XmlTags.V_Fun_COO, XmlTags.V_Fun_UNI) && alignCompt.text == '')
        return false;

      // 5、 不能有倒装
      let sbjSeps = proxy.GridUtil.findElemsByCol(acTop, 1, GlobalConst.GridMaxCol, SbjSep);
      if (sbjSeps && sbjSeps.find((o) => o.belongIniType(XmlTags.A_Inv))) return false;
      let objSeps = proxy.GridUtil.findElemsByCol(acTop, 1, GlobalConst.GridMaxCol, ObjSep);
      if (objSeps && objSeps.find((o) => o.belongIniType(XmlTags.A_Inv))) return false;

      // console.log(proxy.lineSvg);
      //#region 判断连接线是否穿过中间小句
      // let svgLeft = compt.lineSvg.style.left.replace("px", "");
      // let svgTop = compt.lineSvg.style.top.replace("px", "");
      // let svgHeight = compt.lineSvg.style.height.replace("px", "");

      // let rIdx = compt.row > acTop.row ? -1 : 1;
      // let tgRow = compt.row + rIdx;
      // let nearGrid = gcs.find((o) => o.row == tgRow);
      // while (tgRow != acTop.row && nearGrid != null) {
      //   // console.log(nearGrid.$el);
      //   let p = proxy.getPosition(nearGrid.$el);
      //   if (p != null) {
      //     let mx = p.x;
      //     let my = p.y;
      //     // console.log(
      //     //   "mx:" + mx + "\tmy:" + my + "\tw:" + nearGrid.$el.offsetWidth + "\th:" + nearGrid.$el.offsetHeight
      //     // );
      //     let xc = svgLeft > mx + 10;
      //     let yc = my > svgTop && my < svgTop + svgHeight;
      //     // console.log("xc:" + xc + "\tyc:" + yc);
      //     // 当前句与连接成分之间的连接线不能穿过中间小句
      //     if (xc && yc) {
      //       return true;
      //     }
      //   }
      //   tgRow += rIdx;
      //   nearGrid = gcs.find((o) => o.row == tgRow);
      // }
      //#endregion
      return true;
    };

    //#endregion

    // 补充空主语
    const addEmptySbj = () => {
      let first = proxy.childrenItems.firstOrDefault((o) => o.belongIniType(XmlTags.C_Wei));
      if (first != null && first.nearestLeftCompt(XmlTags.C_Zhu) == null) {
        arrowAddSbj = true; // 防止重复提交
        proxy.SentBuilder.addComponent('addSbj', first, null, false, { shiftKey: true });
        nextTick(() => {
          proxy.parentCompt.adjustAlignLine(proxy);
        });

        setTimeout(() => {
          arrowAddSbj = false; // 重置状态
        }, 200);
      }
    };

    const dragVue = ref(); // 最外层dragVue
    const deactivateDrag = () => {
      if (dragVue.value) {
        dragVue.value.enabled = false; // drag控件激活状态参数
      }
    };

    //#region 拖动相关判断
    const isActive = ref(false); //成分是否激活状态
    const isMoving = ref(false); //成分是否移动中，样式控制
    const isDel = ref(false); //成分是否可删除状态，样式控制，先改变isMoving再改变isDel
    const isDragActived = ref(true); //针对VueDraggableResizable，拖动控件是否激活状态，用于判断isActive
    const isRecorded = ref(false); //是否保存操作记录

    watch(isActive, (newVal, oldVal) => {
      if (newVal) {
        className.value = 'drag-active-class';
        // if (proxy.belongType(GridCompt, StackCompt)) { //import GridCompt会造成循环引用报错，改用其他条件判断
        if (proxy.belongType('GridCompt', 'StackCompt') || (proxy.wordUnit != null && !proxy.wordUnit.isFocused)) {
          // todo editor逻辑外移
          // console.log(editor);
          if (editor.value != null && editor.value.updateFloatInfo) {
            editor.value.updateFloatInfo(iniType4Show.value);
          }
        }
      } else {
        className.value = 'drag-class';
      }
    });

    const onDragging = (tx, ty) => {
      // const tx = _pos.x;
      // const ty = _pos.y;
      // console.log(tx, ty);
      x.value = tx;
      y.value = ty;
      z.value = 999;

      // 对齐操作前添加记录
      if (proxy.belongType('GridCompt') && isInMainLine.value && !isRecorded.value) {
        isRecorded.value = true;
        lastAlignCompt.value = alignCompt.value;
        // todo editor逻辑外移
        // console.log(editor);
        if (editor.value && editor.value.record) editor.value.record();
      }

      acMovingToolTip(false, '');
      let _targetCompt;
      if (Math.abs(tx) > 0 || Math.abs(ty) > 0) {
        showActionTip.value = true;
        const { content, targetCompt } = moveAction(tx, ty, false);
        _targetCompt = targetCompt;
        actionTipContent.value = content;
        acMovingToolTip(true, actionTipContent.value);
      }
      acDragging(_targetCompt);

      if (ty > 30) align2Top.value = false;
      else if (ty < -30) align2Top.value = true;

      if (isOutDiagramBorder()) {
        isMoving.value = false;
        isDel.value = true;
      } else {
        if (Math.abs(tx) > 0 || Math.abs(ty) > 0) isMoving.value = true;
        isDel.value = false;
      }

      return false; //不会阻止继续拖动
    };

    const onDragstop = (px, py) => {
      isRecorded.value = false;
      acMovingToolTip(false, '');
      proxy.diagram.activeElement = null;

      z.value = 0;
      if (px == 0 && py == 0 && px == x.value && py == y.value) return;

      // console.log('stop')
      if (line.value == null) {
        x.value = 0;
        proxy.aLineWidth = 0;
      } else {
        position();
      }
      if (proxy.belongType('GridCompt') && isMainSent.value && isInStack.value) {
        // todo优化 现在是全部句子调整划线，应该取相关句子，根据依赖关系依次调整
        let gcs = proxy.parentCompt.gridCompts();
        let idx = 0;
        let inter = setInterval(() => {
          if (idx == gcs.length) {
            // debugger;
            proxy.parentCompt.adjustAllArcPoint();
            clearInterval(inter);

            adjustLineZIndex();
            return;
          }
          let gc = gcs[idx];
          gc.position();
          // 句2(gc)对齐到句1的句首 → 句1变成根句子时 ： 句2需变成根句子
          if (gc.alignCompt != null && gc.alignCompt.isMainSent && gc.alignCompt.dependCompt == gc.alignCompt) {
            gc.alignCompt = null;
            gc.dependCompt = gc;
          }
          // 句1指向句2(gc) → 句1向右对齐句2(gc)时 ：句2需变成根句子
          else if (gc.dependCompt && gc.dependCompt.alignCompt && gc.dependCompt.alignCompt.mainSentCompt == gc) {
            gc.dependCompt = gc;
          }
          // 句子没有对齐成分时，变成根句子
          else if (gc.alignCompt == null && gc.dependCompt == null) gc.dependCompt = gc;
          gc.arcPosition();

          idx++;
        }, 1);

        if (dependCompt.value != proxy && lineRelation.value == '') setLineRelation(GlobalConst.ZhanWei, true);
      }
      y.value = 0;
      z.value = 0;

      isMoving.value = false;
      isDel.value = false;
      actionTipContent.value = '';

      // 移动端touchstart没有阻止后续事件，导致抬起时会有问题
      if (editor.value != null && editor.value.showFlag) return;

      moveAction(px, py);
    };

    //多个嵌套时，从内到外依次触发
    const onDragStartCallback = () => {
      // console.log('dragstart-on1:' + proxy.$options.name);
      // console.log(proxy)
      if (!proxy.editable) return;
      if (
        activeComponent.value &&
        activeComponent.value.isDragActived &&
        !isSelfOrAncestor(proxy, activeComponent.value)
      ) {
        activeComponent.value.isActive = true;
        isActive.value = false;
        return false; //是否可以拖动，阻止事件冒泡
      }

      if (activeComponent.value != null) {
        activeComponent.value.isActive = false;
      }
      if (focusedWordUnit.value != null) {
        focusedWordUnit.value.activeType = null;
      }

      upActiveComponent(proxy);
      // console.log(activeComponent.value, proxy._.uid);
      isActive.value = true;

      //方法执行顺序    :onDragStart>@activated>:onDrag> @dragging
      //从内到外点击时，内层会激活onDeactivated，清空activeComponent，外1激活，其余外n不激活
      //从外到内点击时，内层先onDragStartCallback后onActivated，需要判断activeComponent是否外层，进行焦点切换
      // if (proxy.GLOBAL.activeComponent != null && !proxy.isSelfOrAncestor(proxy, proxy.GLOBAL.activeComponent)) {
      //   proxy.isActive = false;
      //   return false;//是否可以拖动，阻止事件冒泡
      // }
    };

    const isSelfOrAncestor = (obj, anc) => {
      //多次点击自己
      if (obj === anc || obj._.uid == anc._.uid)
        //_uid递增且唯一
        return true;

      let p = obj.parentCompt;
      while (p != null && p != anc) p = p.parentCompt;

      return p == anc;
    };

    const onActivated = () => {
      // console.log('onActivated' + proxy.text);
      // console.log(proxy.$children[0].enabled); // 控件激活状态参数
      // 注：拖拽库机制，控件在Destroy以后还会触发激活
      if (!proxy.editable) return;
      // console.log(store);
      isDragActived.value = true;
      if (activeComponent.value != null && activeComponent.value != proxy) {
        activeComponent.value.isActive = false;
      }
      if (focusedWordUnit.value != null && focusedWordUnit.value != proxy.wordUnit) {
        focusedWordUnit.value.activeType = null;
      }

      upActiveComponent(proxy);
      proxy.isActive = true;
    };
    const onDeactivated = () => {
      // console.log(proxy.$children[0].enabled); // 控件激活状态参数
      // console.log("onDeactivated" + proxy.text);
      isDragActived.value = false;
    };
    //#endregion

    //#region 折叠和展开
    const foldClick = (e) => {
      // console.log(e);
      // 兼容移动端单击，放开adv和ind的pointer-events限制，
      // 通过光标与伪元素距离layerY和样式类来判断是否点击在符号标记上
      if (e == null || e.target == null || e.button != 0) return;
      // console.log(proxy.sepClass);
      if ((proxy.sepClass != '' && e.layerY > 5) || e.target.className.indexOf('fold') < 0) {
        if (e.pointerType == 'touch') {
          proxy.onMouseUp({ button: 2 });
        }
        return;
      }

      proxy.isFold = !proxy.isFold;
      if (proxy.isFold) {
        isActive.value = false;
        foldComponent();
      } else {
        isActive.value = true;
        unfoldComponent(true);
      }
    };
    // 收起成分
    const foldComponent = () => {
      let childNodes = proxy.layoutDiv.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child.nodeType != 1 || child.className == 'tip-content') continue;

        if (!SubSep.All[props.iniType].contains(child.className)) {
          child.style.display = 'none';
        } else {
          child.className = SubSep.Fold[props.iniType];
          // 定状补独，虚浮提示
          if (ExprTags.Syn_Left[props.iniType] != null) {
            child.setAttribute(
              'title',
              ExprTags.Syn_Left[props.iniType] + proxy.toXml().textContent + ExprTags.Syn_Right[props.iniType]
            );
          }
          // 顶起主谓宾，文字提示
          else {
            proxy.tipContent = ExprTags.Syn_Lift_L + proxy.toXml().textContent + ExprTags.Syn_Lift_R;
          }
        }
      }

      diagram.value.linePosition();
    };

    // 展开成分
    const unfoldComponent = (show) => {
      let childNodes = proxy.layoutDiv.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child.nodeType != 1 || child.className == 'tip-content') continue;

        // console.log(child);
        if (!SubSep.All[props.iniType].contains(child.className)) {
          child.style.display = 'inherit';
        } else {
          child.setAttribute('title', '');
          proxy.tipContent = '';
          if (show) child.className = SubSep.Unfold[props.iniType];
          else child.className = SubSep.Default[props.iniType];
        }
      }
      diagram.value.linePosition();
    };
    //#endregion
    const loadChildLineCompt = () => {};

    return {
      ...UIElement.setup(props, ctx),
      // ref
      actionTipContent,
      align2Top,
      alignCompt,
      biasDiv,
      className,
      dependArc,
      dependCompt,
      dragVue,
      endPlug,
      hidAlignCompt,
      iniEndPlug,
      isActive,
      isDel,
      isDragActived,
      isLoaded,
      isMoving,
      isRecorded,
      line,
      lineLoaded,
      lineRelation,
      lineSvg,
      lineSvgArea,
      lineX,
      lineY,
      lastAlignCompt,
      moveEvent,
      oriLineRelation,
      oriRelBias,
      oriSubRel,
      oriTpcRel,
      relationTip,
      relationTipTarget,
      relationTipContent,
      relBias,
      relDiv,
      showActionTip,
      showRelationTip,
      subDiv,
      subRel,
      topicRelation,
      x,
      y,
      z,
      // computed
      diagram,
      diagramParentDiv,
      editor,
      iniType4Show,
      isInBlock,
      isInMainLine,
      isInStack,
      isMainSent,
      isPara,
      isOnlySbj,
      mainLineCompt,
      mainSentCompt,
      // method
      acDragging,
      adjustArcGravity,
      adjustLineZIndex,
      arcPosition,
      clearRelation,
      deactivateDrag,
      foldClick,
      getCursorPosition,
      getPosition,
      initialArcStart,
      initialLineSandE,
      isOutDiagramBorder,
      isSentFirstCompt,
      isSentLastCompt,
      lineMouseUP,
      loadChildLineCompt,
      moveAction,
      onActivated,
      onDeactivated,
      onDragging,
      onDragStartCallback,
      onDragstop,
      position,
      relDivPosition,
      setDependArcInfo,
      setLineRelation,
      setRelationBias,
      setRelDivVisible,
    };
  },
};

//#region private methods
/**
 * 根据当前成分和依存成分计算弧线gravity和maxLeft
 * @param {Vue} compt 当前成分
 * @param {Vue} dependCompt 当前成分的依存成分
 * @returns
 */
function calculateArcInfo(compt, dependCompt) {
  let gravity = 0,
    maxLeft = GlobalConst.ArcMarginLeft;
  if (compt == null || dependCompt == null) return { gravity, maxLeft };

  let sLine = dependCompt.hLine;
  let eLine = compt.hLine;

  let offset;
  if (dependCompt.row > compt.row) {
    offset = dependCompt.$el.offsetTop - compt.$el.offsetTop - eLine.offsetTop + sLine.offsetTop;
  } else offset = compt.$el.offsetTop - dependCompt.$el.offsetTop - sLine.offsetTop + eLine.offsetTop;
  gravity = offset / 3;
  // console.log(gravity);
  maxLeft = gravity < GlobalConst.ArcMarginLeft ? GlobalConst.ArcMarginLeft : gravity + 10;

  let gcs = compt.parentCompt.gridCompts();
  // 句间关系文字占用距离    向左拖动时会有问题，没有弧时，应为ArcMarginLeft，有弧时应+15
  if (gcs.some((o) => o.dependCompt != null && o.dependCompt != o)) maxLeft += 15;
  // console.log(maxLeft);
  return { gravity, maxLeft };
}
//#endregion
</script>