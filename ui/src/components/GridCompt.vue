<template>
  <vue-draggable-resizable ref="dragVue" :class="'g-drag ' + className" w="auto" h="auto" :x="x" :y="y" :z="z"
                           :style="paddingStyle + gridStyle + alignStyle" :draggable="editable"
                           :onDragStart="onDragStartCallback" @dragging="onDragging" @dragstop="onDragstop"
                           @activated="onActivated" @deactivated="onDeactivated" @mouseup.native="onMouseUp">
    <div class="gridcompt" style="cursor:grab;" ref="layoutDiv">
      <div :class="pointClass" :style="'width:' + aLineWidth + 'px;'"></div>
      <component :is="comptTypes[idx]" :key="item.key" v-bind="item" v-for="(item,idx) in items"
                 ref="itemRefs" v-on:compt-loaded="comptLoaded" />
      <div v-if="tipContent != ''" class="tip-content">{{ tipContent }}</div>
      <div v-if="hLineClass != ''" :class="hLineClass + ' ' + hErClass" ref="hLine" :data-err="relErr"
           :style="{'--errRight' :errRight + 'px'}"></div>
      <div v-if=" sepClass !=null && sepClass !=''" :class=" sepClass" @click="foldClick"></div>
      <div v-if="indRClass != ''" :class="indRClass"></div>
      <div v-if="showExpand" :class="expandClass" @click="expandGrid">
        <p class="q-my-sm">{{ wholeText }}</p>
      </div>
    </div>
    <!-- <q-tooltip ref="actionTip" :no-parent-event="true" :offset="[0, 0]" transition-show="scale"
                 v-model="showActionTip">
        {{ actionTipContent }}
      </q-tooltip>

      <q-tooltip ref="relationTip" :no-parent-event="true" anchor="center right" self="center left"
                 :target="relationTipTarget" v-model="showRelationTip">
        {{ relationTipContent }}
      </q-tooltip> -->
  </vue-draggable-resizable>
</template>

<script>
import XmlTags from '../api/xml_tags';
import TextType from '../enum/text_type';
import TextRegion from '../enum/text_region';
import PlugType from '../enum/plug_type';
import SubSep from '../enum/sub_sep';
import UniPos from '../enum/uni_pos';
import GlobalConst from '../enum/global_variable';
import GridUtil from '../api/grid_util';
import Common from '../api/common';

import BaseCompt from './BaseCompt.vue';
import GridCompt from './GridCompt.vue';
import TextCompt from './TextCompt.vue';
import StackCompt from './StackCompt.vue';
import SbjSep from './assist/SbjSep.vue';
import PrdSep from './assist/PrdSep.vue';
import ObjSep from './assist/ObjSep.vue';
import WordFlag from './assist/WordFlag.vue';
import FillLifter from './assist/FillLifter.vue';

import VueDraggableResizable from 'vue-draggable-resizable/src/components/vue-draggable-resizable.vue';
// import { QTooltip } from 'quasar';

import { ref, getCurrentInstance, nextTick, onMounted, computed, watch, onBeforeUnmount, shallowRef } from 'vue';

export default {
  name: 'GridCompt',
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
    const { proxy, appContext } = getCurrentInstance();

    const items = ref([]); // Grid的组成数据源
    const itemRefs = ref([]); // Grid的组成Vue（TextCompt）
    const comptTypes = shallowRef([]); // 与shallowRef、compsObj一起使用防止报错 Vue received a Component which was made a reactive object
    const compsObj = shallowRef({
      BaseCompt,
      TextCompt,
      GridCompt,
      SbjSep,
      PrdSep,
      ObjSep,
      FillLifter,
      WordFlag,
    });

    const sameAlignCompts = ref([]); // 依附于当前句，需等当前句加载完成后再完成对齐的句子
    const sentId = ref(0); // 句子sentId，段落标注中该值>0
    const ignore = ref(false); // 是否非句
    const isFold = ref(false); // 成分折叠展开状态，默认展开,
    const showExpand = ref(false); // 是否展示收起展开标记
    const isUpdated = ref(false); // 自身及子控件是否更新完毕
    const childrenLoaded = ref(false); // 子成分是否加载完成
    const lineLoaded = ref(false); // 依赖线条成分是否赋值完毕
    watch(ignore, (nv) => {
      if (nv) {
        nextTick(() => {
          proxy.editable = false;
          // 非句文字颜色，箭头不显示
          expandClass.value += ' text-grey ';
          setLineColor('transparent');
        });
      }
    });
    onMounted(() => {
      // console.log('grid-mounted')
      initialLine();
    });

    //#region 小句及关联句收起/展开
    const expandClass = ref('expand-gwhole');
    const wholeText = ref(''); // 收起时，显示的本文
    watch(wholeText, (nv) => {
      if (nv == null || nv == '') {
        expandClass.value = 'expand-gwhole';
      } else {
        expandClass.value = 'gwhole';
      }
    });
    const expandAll = () => {
      expandGrid();
    };
    const expandGrid = () => {
      if (props.parentCompt != null && props.parentCompt.belongType(StackCompt)) props.parentCompt.expandGrid(proxy);
      else {
        if (wholeText.value != '') {
          // 段落中，句子展示时添加展开标记
          props.xml.removeAttribute(XmlTags.A_Expand);
          wholeText.value = '';
          if (props.xml.hasAttribute(XmlTags.A_Auto)) proxy.autoParse();
          else fromXml(false);
        } else {
          // 收起
          let xml = proxy.toXml().cloneNode(true);
          xml.setAttribute(XmlTags.A_Id, sentId.value);
          xml.setAttribute(XmlTags.A_Expand, 0);
          wholeText.value = xml.textContent;
          items.value.length = 0;
          proxy.updateParentItem('xml', xml);
        }
        if (proxy.diagram) {
          proxy.diagram.linePosition();
          proxy.diagram.isOpen = wholeText.value == '';
        }
      }
    };
    //#endregion

    //#region 线条样式
    const paddingStyle = ref(''); // vueDrag的样式
    const alignStyle = ref('');
    const layoutDiv = ref(''); // 成分外层div
    const tipContent = ref(''); // 收起后提示的文字
    const hLineClass = ref(''); // 水平线样式
    const hErClass = ref(''); // 偏误标记
    const relErr = ref(''); // 偏误内容
    const errRight = ref(-8); // 定义style中样式变量，通过var(--errRight)来改变伪元素样式  todo Vue3可在css使用v-bind
    const hLine = ref(); // 水平线div
    const sepClass = ref(''); // 垂直分割线样式
    const indRClass = ref(''); // 独立语右边空白样式
    // 视图渲染完后添加横线和竖线
    const initialLine = () => {
      if (layoutDiv.value == null) return;

      // console.log(proxy, typeof proxy, Object.prototype.toString.call(proxy));
      // console.log(proxy.belongIniType, typeof proxy.belongIniType, Object.prototype.toString.call(proxy.belongIniType));
      // console.log(appContext, appContext.config.globalProperties);

      // 1.Stack中小句
      if (proxy.isInStack) {
        hLineClass.value = 'mainline';
      }
      // 2.定语、状语
      else if (proxy.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang)) {
        hLineClass.value = 'leftline';
        sepClass.value = SubSep.Default[props.iniType];
      }
      // 3.补语
      else if (proxy.belongIniType(XmlTags.C_Bu)) {
        hLineClass.value = 'rightline';
        sepClass.value = SubSep.Default[props.iniType];
      }
      // 4.独立语
      else if (proxy.belongIniType(XmlTags.C_Ind)) {
        hLineClass.value = 'indline';
        sepClass.value = SubSep.Default[props.iniType];
        indRClass.value = 'ind-right';
      }
      // 5.一般情况
      else {
        hLineClass.value = 'mainline';
      }

      if (proxy.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin)) {
        alignStyle.value = 'align-self:end;';
      } else if (
        props.parentCompt != null &&
        props.parentCompt.belongType(StackCompt) &&
        props.parentCompt.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Ind)
      ) {
        alignStyle.value = 'justify-self:end;';
      }
    };
    // 清除自身依赖的线条
    const clearLine = () => {
      if (proxy.line != null) {
        try {
          // console.log(proxy.line);
          proxy.line.remove();
        } catch (error) {}
        proxy.line = null;
        proxy.lineX = 0;
      }
      if (proxy.dependArc != null) {
        try {
          proxy.dependArc.remove();
        } catch (error) {}
        proxy.dependArc = null;
      }

      proxy.clearRelation();
    };

    watch(
      () => props.iniItems,
      (newVal, oldVal) => {
        // console.log(newVal);
        // console.log(oldVal)
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

    // 独词句样式
    watch(
      items,
      (nv) => {
        // console.log(nv, nv.length);
        comptTypes.value = [];
        for (let i = 0; i < nv.length; i++) {
          const element = nv[i];
          if (element != null) {
            comptTypes.value.push(compsObj.value[element.component.name]);
            element.parentCompt = proxy;
          }
        }
        if (proxy.belongIniType(XmlTags.O_Sent)) {
          if (nv.length == 1 && nv[0].iniType == XmlTags.C_Zhu) paddingStyle.value = 'padding-bottom:10px;';
          else paddingStyle.value = '';
        }
      },
      { deep: true, flush: 'sync' }
    );
    //#endregion

    //#region 编解码
    // 图形编码到XML
    const toXml = () => {
      if (wholeText.value != '') {
        return props.xml.cloneNode(true);
      }

      let xmlDoc = new Document();
      let iniType = props.iniType;
      // let iniTypeUp = iniType == undefined ? "" : iniType.toUpperCase();
      let elem = xmlDoc.createElement(proxy.isMainSent ? XmlTags.C_Sent : iniType);
      if (sentId.value > 0) {
        if (ignore.value) elem.setAttribute(XmlTags.A_Ignore, 1);
        elem.setAttribute(XmlTags.A_Id, sentId.value);
      }
      let cItems = proxy.childrenItems.sort((a, b) => a.column - b.column);

      proxy.XmlParser.componentsAddToXml(proxy, cItems, elem);

      //移除主句上的空宾语
      if (proxy.isMainSent) {
        let child = elem.firstChild;
        let lastObj = null,
          objCount = 0;
        while (child != null) {
          let ns = child.nextSibling;
          if (child.tagName == XmlTags.C_Bin) {
            objCount++;
            lastObj = child;
          } else if (child.tagName == XmlTags.C_CC && child.hasAttribute(XmlTags.A_Fun)) {
            if (objCount == 1 && lastObj.isEmptyX()) elem.removeChild(lastObj);

            objCount = 0;
            lastObj = null;
          }
          child = ns;
        }

        if (objCount == 1 && lastObj.isEmptyX()) elem.removeChild(lastObj);
      }

      //独词句处理
      if (proxy.isMainSent && elem.element(XmlTags.C_Wei) == null) {
        let sbj = elem.element(XmlTags.C_Zhu);
        if (sbj != null) {
          sbj.removeSelfTag();
        }
        let temp = elem.element(XmlTags.O_Temp);
        if (temp != null) {
          temp.removeSelfTag();
        }
      }

      //倒装处理
      let invElems = elem.elements().filter((p) => p.hasAttribute(XmlTags.A_Inv));
      for (let i = 0; i < invElems.length; i++) {
        const invElem = invElems[i];
        invElem.removeAttribute(XmlTags.A_Inv);
        //主语倒装
        if (invElem.tagName == XmlTags.C_Zhu) {
          var ccUni = invElem
            .elementsAfterSelf(XmlTags.C_CC)
            .firstOrDefault((p) => p.hasAttribute(XmlTags.A_Fun) && p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_UNI);
          if (ccUni != null) ccUni.addBeforeSelf(invElem);
          else elem.appendChild(invElem);
        } else {
          //宾语倒装，因为宾语倒装标记是放在obj前一个节点上
          let invObj = invElem.elementsAfterSelf(XmlTags.C_Bin).firstOrDefault();
          if (invObj) {
            let insertNode = invObj.elementsBeforeSelf(XmlTags.C_Wei).lastOrDefault();
            // 谓语前有合成谓语，移到合成谓语前（todo 暂时只支持一个合成谓语）
            while (insertNode != null && insertNode.previousElementSibling != null) {
              let prev = insertNode.previousElementSibling;
              if (prev.tagName == XmlTags.C_UV && !prev.hasAttribute(XmlTags.A_Fun)) insertNode = prev;
              else if (prev.nameIs(XmlTags.C_CC) && prev.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_SYN) {
                insertNode = prev.previousElementSibling;
                break;
              } else break;
            }
            insertNode.addBeforeSelf(invObj);
          }
        }
      }

      //宾语辖域SCP处理
      let prdElems = elem.elements().filter((p) => p.tagName == XmlTags.C_Wei);
      for (let i = 0; i < prdElems.length; i++) {
        const prdElem = prdElems[i];
        let scp = 'V';
        let pre = prdElem.previousElementSibling;

        //宾语前可能有助词
        if (
          (pre != null && pre.tagName == XmlTags.C_Bin) ||
          (pre != null &&
            pre.tagName == XmlTags.C_UV &&
            pre.previousElementSibling != null &&
            pre.previousElementSibling.tagName == XmlTags.C_Bin)
        )
          scp = 'OV';

        let next = prdElem.nextElementSibling;
        // console.log('scp')
        while (next != null) {
          if (
            next.tagName == XmlTags.C_CC &&
            next.hasAttribute(XmlTags.A_Fun) &&
            XmlTags.Prd_Fun.indexOf(next.getAttribute(XmlTags.A_Fun) > -1)
          )
            break;

          if (
            next.tagName == XmlTags.C_CC &&
            next.hasAttribute(XmlTags.A_Fun) &&
            (XmlTags.V_Fun_COO == next.getAttribute(XmlTags.A_Fun) ||
              XmlTags.V_Fun_APP == next.getAttribute(XmlTags.A_Fun))
          )
            break;

          if (next.tagName == XmlTags.C_Zhu) break;

          if (next.tagName == XmlTags.C_Bin) scp += 'O';
          else if (next.tagName == XmlTags.C_Bu) scp += 'C';

          next = next.nextElementSibling;
        }
        prdElem.setAttribute(XmlTags.A_Scp, scp);
      }

      // 记录复句偏移信息    注：如果跨过非句对齐，则编码会有问题
      let indent;
      let coh;
      if (proxy.alignCompt != null && proxy.line != null) {
        let idx = 0;
        let ac = proxy.alignCompt;
        let acParent;
        // 对齐到句首
        if (ac.isMainSent) {
          acParent = ac;
        }
        // 对齐其他
        else {
          acParent = ac.parentCompt;
          let acCol = ac.column;
          let temp = ac;
          let isLast = true;
          while (acParent != null) {
            if (isLast && acParent.childrenItems.lastOrDefault((o) => o.belongType(BaseCompt)) != temp) {
              isLast = false;
            }
            if (acParent.isMainSent) {
              break;
            }
            temp = acParent;
            acCol = acParent.column;
            acParent = acParent.parentCompt;
          }

          let tcs = [];
          let leftCompts = GridUtil.findElemsByCol(acParent, 1, acCol, BaseCompt);
          leftCompts.forEach((o) => {
            if (o.belongType(TextCompt)) {
              tcs.push(o);
            } else {
              let array = [];
              Common.traverseType(o, TextCompt, array);
              tcs = tcs.concat(array);
            }
          });
          let bTypes = [XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Ind, XmlTags.C_Zhu];
          let liftIdx = 0; // 顶起成分，取末尾一个成分
          // console.log(ac);
          for (let i = 0; i < tcs.length; i++) {
            const tc = tcs[i];

            if (tc.getTopComptByIniType(bTypes) != ac && liftIdx > 0) break;

            // 排除空虚词位和空宾语
            if (
              !(
                tc.text == '' &&
                (tc.textType != TextType.SOLID || (tc.belongIniType(XmlTags.C_Bin) && tc.isInMainLine))
              )
            )
              idx++;

            // console.log(tc);
            // console.log(tc.getTopComptByIniType(bTypes));
            if (tc == ac) break;
            else if (tc.getTopComptByIniType(bTypes) == ac) liftIdx = idx;
          }
        }

        // console.log(tcs);
        try {
          switch (proxy.line.endPlug) {
            case PlugType.Behind:
              coh = XmlTags.V_Coh_PRE;
              break;
            case PlugType.Disc:
              coh = acParent.row > props.row ? XmlTags.V_Coh_END_Up : XmlTags.V_Coh_END;
              // idx = -1;
              idx = XmlTags.V_Indent_E;
              break;
            case PlugType.Arrow1:
              coh = acParent.row > props.row ? XmlTags.V_Coh_ONE_Up : XmlTags.V_Coh_ONE;
              // 末尾向下箭头，无主语时算词位置，有主语时coh=-1 20220304
              // 20220317 取消-1，按句首依存标注
              // if (
              //   isLast &&
              //   proxy.childrenItems
              //     .firstOrDefault(p => p.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei))
              //     .belongIniType(XmlTags.C_Zhu)
              // ) {
              //   idx = -1;
              // }
              break;
          }

          // todo 待优化，和前面判断idx逻辑合并  包含兼容历史数据的处理（对齐到同一成分改为对齐句首）
          // 基于不能跨句对齐    图形上多句对齐同一成分时，后一句指向前一句句首
          if (idx != 0 && idx != XmlTags.V_Indent_E) {
            let grids = props.parentCompt.gridCompts();

            let s;
            let e;
            let i;
            if (acParent.row > proxy.row) {
              s = acParent.row - 1;
              e = proxy.row;
              i = -1;
            } else {
              s = acParent.row + 1;
              e = proxy.row;
              i = 1;
            }

            while (((s > e && i < 0) || (s < e && i > 0)) && s != e) {
              const preAlign = grids.find((o) => o.row == s);
              // 对齐到所有对齐到同一成分句子中最近一句的句首
              if (preAlign && preAlign.alignCompt == proxy.alignCompt) {
                acParent = preAlign;
                idx = 0;
                break;
              }
              s += i;
            }
          }

          indent = getIndent(acParent) + ':' + idx;
          // console.log(indent);
          // console.log(proxy.alignCompt);
        } catch (error) {}
      }
      // 依存弧指向自身的根节点不保存
      else if (proxy.dependArc != null && proxy.dependCompt != null && proxy.dependCompt != proxy) {
        indent = getIndent(proxy.dependCompt) + ':' + XmlTags.V_Indent_S;
      }

      // todo xj节点加id，小句序号
      // if (proxy.isMainSent) {
      //   let xjId = getIndent(proxy);
      //   elem.setAttribute(XmlTags.A_Id, xjId == null ? 1 : xjId);
      // }

      if (coh) elem.setAttribute(XmlTags.A_Coh, coh);
      if (indent) elem.setAttribute(XmlTags.A_Indent, indent);
      if (proxy.lineRelation && proxy.lineRelation != '' && proxy.lineRelation != GlobalConst.ZhanWei)
        elem.setAttribute(XmlTags.A_Rel, proxy.lineRelation);
      if (proxy.subRel && proxy.subRel != '') elem.setAttribute(XmlTags.A_Sub, proxy.subRel);
      let aErr = 0;
      if (proxy.relBias && proxy.relBias != '') {
        if (proxy.relBias == '*') aErr += 1;
        else elem.setAttribute(XmlTags.A_Eor, proxy.relBias.substring(1));
      }
      if (hErClass.value != '') {
        if (relErr.value == '*') aErr += 2;
        else elem.setAttribute(XmlTags.A_Eoj, relErr.value.substring(1));
      }
      if (aErr != 0) elem.setAttribute(XmlTags.A_Err, aErr);
      // console.log(invElems)
      // console.log(elem.cloneNode(true));

      return elem;
    };

    /**
     * 获取小句对齐信息
     * @param {GridCompt} grid 待转化的XML
     * @returns {String} (跨句上负下正:) 小句内句序号
     */
    const getIndent = (grid) => {
      // console.log(grid);
      let aSent = '';
      let aRow = grid.row == null ? 1 : grid.row;
      let sentIds = proxy.diagram.sentIds;
      // console.log(sentId.value);
      if (sentId.value > 0) {
        let sIdx = sentIds.indexOf(grid.sentId);
        let before = sentIds.filter((o) => sentIds.indexOf(o) < sIdx);
        if (before.length > 0) {
          let beforeGrid = props.parentCompt.gridCompts().filter((o) => before.contains(o.sentId));
          aRow -= beforeGrid.length;
        }
        if (grid.sentId != sentId.value) {
          let aIdx = sentIds.indexOf(grid.sentId) - sentIds.indexOf(sentId.value);
          aSent = aIdx + ':';
        }
      }
      return aSent + aRow;
    };

    // XML解码到图形
    const fromXml = (autoTag) => {
      // console.log(proxy.childrenItems);
      // console.log(proxy.xml.cloneNode(true));
      let editor = proxy.editor;
      let xml = props.xml;
      let diagramEditable = editor == null ? false : editor.diagramEditable && !ignore.value;
      // 1.先初始化items，等各成分生成后，调用自身fromXml，触发步骤2
      if (proxy.childrenItems.length == 0) {
        let expand = true;
        if (xml.hasAttribute(XmlTags.A_Id)) {
          expand = xml.getAttribute(XmlTags.A_Expand) != '0' && !xml.hasAttribute(XmlTags.A_Auto);
          sentId.value = parseInt(xml.getAttribute(XmlTags.A_Id));
          ignore.value = xml.hasAttribute(XmlTags.A_Ignore);
        }

        if (sentId.value > 0) showExpand.value = true;

        // 未分析的句子和非句默认不展开
        if (showExpand.value && (!expand || ignore.value)) {
          wholeText.value = xml.textContent.replace(/\s+/g, '');
        } else {
          wholeText.value = '';
        }
        if (wholeText.value != '') {
          if (diagramEditable) proxy.editable = true;
          else proxy.editable = false;

          // 段落标注中只加载文字的情况
          lineLoaded.value = true;
          return;
        }

        // 有问题的数据，暂时不处理，图形会有问题
        if (xml == null || xml.childElementCount == 0) {
          return;
        }

        proxy.XmlParser.initialItems(proxy);
        nextTick(() => {
          fromXml(autoTag);
          if (diagramEditable) proxy.editable = true;
          else proxy.editable = false;
        });
      }
      // 2.调用各成分fromXml，生成各自图形
      else {
        isUpdated.value = false;
        for (let i = 0; i < proxy.childrenItems.length; i++) {
          let item = proxy.childrenItems[i];
          // console.log(item);
          if (item.belongType(BaseCompt)) {
            nextTick(() => {
              item.fromXml(autoTag);
              if (diagramEditable) item.active();
            });
          } else if (diagramEditable) item.active();
        }

        // 偏移信息处理    注：如果跨过非句对齐，则解码会有问题
        if (proxy.isMainSent && xml != null && xml.hasAttribute(XmlTags.A_Indent)) {
          let info = parseIndent();
          // console.log(info);
          if (info == null) return;
          let _i = 0;
          let int = setInterval(() => {
            if (childrenLoaded.value) {
              // if (isUpdated.value) {
              clearInterval(int);

              // console.log(info);
              // todo edtior 迁移
              if (editor && !proxy.diagram.isPara && !proxy.$isElectron && info.sIdx != 0) {
                lineLoaded.value = true;
                proxy.setDependArcInfo('非');
                return;
              }

              if (props.parentCompt == null) return;
              let grids = props.parentCompt.gridCompts();
              let alignGrid = grids.find((o) => o.row == info.row);
              if (alignGrid == null) return;

              let alignCompt;
              let hidAc;
              // 末尾
              if (info.tIdx == XmlTags.V_Indent_E || info.tIdx == -1) {
                alignCompt = alignGrid.childrenItems.lastOrDefault((o) => o.belongType(BaseCompt));
              }
              // 多句对齐同一句时
              // 兼容历史数据    20220413
              //     原：1、依存指向词节点为:0    2、对齐句末词，词节点为:-1
              //     新：1、依存指向词节点为:s    2、对齐句末词，词节点为:e    3、对齐上句开头，词节点为:0
              else if (info.tIdx == 0) {
                let { subRootGrid, gInfo } = getSubRootGridByIndent(proxy);
                // console.log(subRootGrid);
                // console.log(gInfo);
                if (gInfo.tIdx != 0) {
                  // ·依存于下面句子
                  if (gInfo.row > props.row) {
                    proxy.align2Top = false;
                  }

                  alignCompt = grids.find((o) => o.row == info.row);
                  hidAc = alignCompt.hidAlignCompt;
                }
                // 旧依存弧数据
                else {
                  proxy.dependCompt = alignGrid;
                }
              }
              // 依存弧
              else if (info.tIdx == XmlTags.V_Indent_S) {
                proxy.dependCompt = alignGrid;
              }
              // 其他
              else {
                let idx = 0;
                let tcs = [];
                Common.traverseType(alignGrid, TextCompt, tcs);
                for (let i = 0; i < tcs.length; i++) {
                  const tc = tcs[i];
                  // 排除空虚词位和空宾语
                  if (
                    !(
                      tc.text == '' &&
                      (tc.textType != TextType.SOLID || (tc.belongIniType(XmlTags.C_Bin) && tc.isInMainLine))
                    )
                  )
                    idx++;
                  if (idx == info.tIdx) {
                    // 按整体处理的类型，需要和BaseCompt中isOutDiagramBorder里面的一致
                    let bTypes = [XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Ind, XmlTags.C_Zhu];
                    let anc = tc.getTopComptByIniType(bTypes);
                    // 可对齐到状语开头介词TextCompt
                    alignCompt =
                      !anc ||
                      (anc.belongIniType(XmlTags.C_Zhuang) && !tc.nearestLeftCompt() && tc.belongIniType(XmlTags.C_PP))
                        ? tc
                        : anc;
                    break;
                  }
                }
              }

              // console.log(alignCompt);
              proxy.alignCompt = alignCompt;
              proxy.hidAlignCompt = hidAc ? hidAc : alignCompt;
              if (alignCompt != null) {
                sameAlignCompts.value.forEach((o) => {
                  // console.log(o);
                  o.alignCompt = alignCompt;
                });
                sameAlignCompts.value = [];
              }
              lineLoaded.value = true;
              let topGrid = alignCompt == null ? null : alignCompt.getTopComptByType('GridCompt');
              if (topGrid != null && topGrid.row > props.row) proxy.align2Top = false;
              let coh = xml.getAttribute(XmlTags.A_Coh);
              switch (coh) {
                case XmlTags.V_Coh_ONE:
                case XmlTags.V_Coh_ONE_Up:
                  proxy.iniEndPlug = PlugType.Arrow1;
                  break;
                case XmlTags.V_Coh_ALL:
                  proxy.iniEndPlug = PlugType.ArrowD;
                  break;
                case XmlTags.V_Coh_PRE:
                  proxy.iniEndPlug = PlugType.Behind;
                  break;
                case XmlTags.V_Coh_END:
                case XmlTags.V_Coh_END_Up:
                  proxy.iniEndPlug = PlugType.Disc;
                  break;
              }
            }

            if (_i > 500) {
              clearInterval(int);
              console.error('GridCompt-Decode');
            }
            _i++;
          }, 5);
        } else if (proxy.isMainSent && props.parentCompt != null) {
          if (props.parentCompt.gridCompts().filter((o) => o.sentId == sentId.value).length > 1) {
            let it = props.parentCompt.gridCompts().find((o) => o.sentId == sentId.value && o.row < props.row);
            if (it == null) {
              proxy.align2Top = false;
            }
          }
          lineLoaded.value = true;
        } else lineLoaded.value = true;

        if (xml) {
          if (xml.hasAttribute(XmlTags.A_Rel)) proxy.oriLineRelation = xml.getAttribute(XmlTags.A_Rel);
          // 无rel的历史数据赋默认值
          else if (xml.hasAttribute(XmlTags.A_Indent)) proxy.oriLineRelation = GlobalConst.ZhanWei;

          if (xml.hasAttribute(XmlTags.A_Sub)) proxy.oriSubRel = xml.getAttribute(XmlTags.A_Sub);
          if (xml.hasAttribute(XmlTags.A_Err)) {
            let attErr = xml.getAttribute(XmlTags.A_Err);
            let iAttErr = parseInt(attErr);
            if (isNaN(iAttErr)) proxy.oriRelBias = attErr;
            else {
              if (iAttErr & 1) proxy.oriRelBias = '*';
              if (iAttErr & 2) {
                relErr.value = '*';
                hErClass.value = 'gc-error';
              }
            }
          }
          if (xml.hasAttribute(XmlTags.A_Eor)) {
            proxy.oriRelBias = '*' + xml.getAttribute(XmlTags.A_Eor);
          }
          if (xml.hasAttribute(XmlTags.A_Eoj)) {
            hErClass.value = 'gc-error';
            relErr.value = '*' + xml.getAttribute(XmlTags.A_Eoj);
          }
        }
      }
    };

    // 获取多句对齐同一根句子的次级句子
    const getSubRootGridByIndent = (compt) => {
      let rootGrid = compt;
      let subRootGrid;
      let gInfo;
      do {
        let info = rootGrid.parseIndent();
        // console.log(info);
        // todo tIdx=0的历史数据会有问题
        if (rootGrid != compt && info.tIdx == XmlTags.V_Indent_S) {
          // console.log("break");
          break;
        }
        // 整句标注中，对齐其他整句的情况，打“非”标记，作根节点处理
        if (info.sIdx != 0 && !proxy.diagram.isPara) {
          break;
        }

        subRootGrid = rootGrid;
        gInfo = info;

        // subRootGrid 对齐到其他句
        if (subRootGrid != compt && info.tIdx != '0') {
          // console.log(subRootGrid);
          // console.log("break");
          break;
        }

        rootGrid = compt.parentCompt.gridCompts().find((o) => o.row == info.row);
        // console.log(rootGrid);
      } while (rootGrid != null && rootGrid.xml != null && rootGrid.xml.hasAttribute(XmlTags.A_Indent));

      return { subRootGrid, gInfo };
    };

    // 返回值说明
    // sIdx：以自身句为基准，其他整句的相对位置（上正下负）；
    // row：所对齐Grid的相对位置（从1开始）；
    // tIdx：所对齐小句内TextCompt序号（从1开始，跳过空虚词位）
    const parseIndent = () => {
      let compt = proxy;
      if (!compt || !compt.xml) return;

      let indent = compt.xml.getAttribute(XmlTags.A_Indent);

      if (!indent) return null;
      // console.log(indent);
      let infos = indent.split(':').map((o) => {
        return o != XmlTags.V_Indent_S && o != XmlTags.V_Indent_E ? parseInt(o) : o;
      });
      if (infos.length < 2 || infos.some((o) => o != XmlTags.V_Indent_S && o != XmlTags.V_Indent_E && isNaN(o))) return;

      // 非段落句子
      if (compt.sentId == 0) {
        if (infos.length == 2) return { sIdx: 0, row: infos[0], tIdx: infos[1] };
        return { sIdx: infos[0], row: infos[1], tIdx: infos[2] };
      }

      let aRow = 0,
        row,
        tIdx;
      if (infos.length == 2) {
        row = infos[0];
        tIdx = infos[1];
      } else {
        aRow = infos[0];
        row = infos[1];
        tIdx = infos[2];
      }

      let sentIds = compt.diagram.sentIds;
      // console.log(sentIds);
      let sIdx = sentIds.indexOf(compt.sentId) + aRow;
      // 找到比对齐小句靠前的整句
      let before = sentIds.filter((o) => sentIds.indexOf(o) < sIdx);
      if (before.length > 0) {
        let beforeGrid = props.parentCompt.gridCompts().filter((o) => before.contains(o.sentId));
        row += beforeGrid.length;
      }

      return { sIdx: aRow, row, tIdx };
    };
    //#endregion

    const aLineWidth = ref(0); // 小句对齐句首占位div宽度
    const pointClass = ref('align-line'); // 小句对齐句首占位div样式
    const onMouseUp = (e) => {
      // console.log(e);
      if (!proxy.editable) return;

      // console.log(aLineWidth.value);
      if (proxy.isMainSent && proxy.isInStack && e.button == 0) {
        if (proxy.editor == null || proxy.editor.activeComponent != proxy) return;

        if (pointClass.value == 'align-line-check') {
          pointClass.value = 'align-line';
          return;
        }

        let gcs = props.parentCompt.gridCompts().filter((o) => o != proxy);
        for (let i = 0; i < gcs.length; i++) {
          const gc = gcs[i];
          if (gc.pointClass == 'align-line-check') {
            // console.log("check");
            //#region 防止成环
            // let temp = gc;
            // let tDc = gc.dependCompt;
            // while (tDc != null && tDc != temp) {
            //   // 依存弧成环的情况，断开以当前句为父节点的环
            //   if (tDc == proxy) {
            //     temp.dependCompt = temp;
            //   }
            //   temp = tDc;
            //   tDc = tDc.dependCompt;
            // }
            // proxy.dependCompt = gc;
            // nextTick(() => {
            //   proxy.arcPosition();
            //   props.parentCompt.adjustAllArcPoint();
            //   proxy.adjustLineZIndex();
            // });
            //#endregion

            //#region 弧线反转 总原则上指下
            let topGrid = gc.row > proxy.row ? proxy : gc;
            let bottomGrid = gc.row > proxy.row ? gc : proxy;

            let bdCompt = bottomGrid.dependCompt;
            // 限制：1. 下句不能为向右移的句子    2. 不能互相指向
            if (bdCompt == null || bdCompt == topGrid) return;

            // todo 有向右移的句子时，防止闭环
            // 限制：向下对齐的句子，不能再指向下句
            if (topGrid.alignCompt != null && topGrid.alignCompt.mainSentCompt == bottomGrid) return;

            let bdRoot = bottomGrid;
            while (bdRoot && bdRoot.dependCompt != bdRoot) {
              bdRoot = bdRoot.dependCompt;
            }
            // console.log(bdRoot);
            if (bdRoot == null) return;

            // C1 bottom句为根节点：上指下
            if (bdCompt == bottomGrid) {
              bottomGrid.dependCompt = topGrid;
              bottomGrid.arcPosition();
            }
            // 袓先结点优先级最高：1指4，4指3；	2、3互连时，3指2
            else if (bdRoot.row < topGrid.row) {
              // 限制：下句依存的根句子和上句对齐的句子不能相同
              if (topGrid.alignCompt && topGrid.alignCompt.mainSentCompt == bdRoot) return;
              topGrid.dependCompt = bottomGrid;
            }
            // C2 bottom句③的父节点句②低于top句①：top句①指向bottom句③（①→③），bottom句③指向原bottom句的父节点句②（③→②）
            else if (bdCompt.row > topGrid.row) {
              if (
                bdCompt.dependCompt != null &&
                bdCompt.dependCompt.alignCompt == null &&
                (bdCompt.dependCompt == bdCompt || bottomGrid.row < bdCompt.dependCompt.row)
              )
                bdCompt.dependCompt = bottomGrid;
              bottomGrid.dependCompt = topGrid;
            }
            // C3 bottom句③的父节点句①高于top句②：下指上（③→②）
            else {
              // 限制：句②不能对齐其他句
              if (topGrid.dependCompt.alignCompt != null) return;
              topGrid.dependCompt = bottomGrid;
            }
            //#endregion
            nextTick(() => {
              gc.arcPosition();
              props.parentCompt.adjustAllArcPoint();
              bottomGrid.adjustLineZIndex();
            });
            return;
          }
        }

        pointClass.value = 'align-line-check';
        return;
      }

      // 鼠标右键进行转换（可编辑、非折叠的状、独）
      if (e.button != 2 || proxy.isInStack || isFold.value) return;
      // 状语转独立语
      if (proxy.belongIniType(XmlTags.C_Zhuang) && proxy.cornerCompt.text == '') {
        let uuIdx = items.value.findIndex((o) => o.iniType == XmlTags.C_UU);
        if (uuIdx >= 0) {
          items.value.splice(uuIdx, 1);
          proxy.updateParentItem('iniType', XmlTags.C_Ind);
          nextTick(() => {
            initialLine();
            // Generic时优先指定叹词
            let temp = proxy.childrenItems.find((o) => o.belongIniType(XmlTags.O_Temp));
            if (temp != null) temp.wordUnit.updateTypeBlock(XmlTags.W_Tan);
          });
        }
      }
      // 独立语转状语
      else if (proxy.belongIniType(XmlTags.C_Ind)) {
        let nLeft = proxy.nearestLeftElem();
        let rights = proxy.rightCompts();
        let firstMain = rights.firstOrDefault((o) =>
          o.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin, XmlTags.C_Wei, XmlTags.O_Temp)
        );
        let sbj = proxy.mainSentCompt.childrenItems.find((p) => p.belongIniType(XmlTags.C_Zhu));
        // console.log("nLeft:", nLeft);
        // console.log("firstMain:", firstMain);
        // 限制非法结构：宾语开头、谓语后面的独立语；NP之间或结尾的独立语；GENERIC/独词句切出的独立语
        // 非独词句 && 前面为状语/连词/多核/SbjSep && 后面首个主干成分是主语/谓语
        if (
          (sbj == null || !sbj.isOnlySbj) &&
          firstMain != null &&
          firstMain.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei) &&
          (nLeft == null ||
            nLeft.belongIniType(XmlTags.C_Zhuang, XmlTags.C_CC, XmlTags.Prd_Fun) ||
            nLeft.belongType(SbjSep))
        ) {
          GridUtil.addItem(
            TextCompt,
            proxy,
            1,
            proxy.GlobalConst.GridMaxCol,
            XmlTags.C_UU,
            null,
            '',
            null,
            TextType.VIRTUAL_CORNER
          );
          proxy.updateParentItem('iniType', XmlTags.C_Zhuang);
          nextTick(() => {
            proxy.active();
            initialLine();
          });
        }
      }

      if (e.stopPropagation) e.stopPropagation();
    };

    const setLineColor = (color = 'black', textColor = 'black') => {
      if (proxy.line) {
        // this.line.startPlugColor = "#a6f41d";
        proxy.line.color = color;
      } else if (proxy.dependArc) {
        // this.dependArc.startPlugColor = "#a6f41d";
        proxy.dependArc.color = color;
      }

      if (proxy.relDiv) {
        // console.log(color);
        // 锁定时，隐藏关系焦点
        if (color == 'black') {
          proxy.relDiv.style.backgroundColor = 'transparent';
        } else {
          proxy.relDiv.style.backgroundColor = 'lightgrey';
        }
      }

      // 箭头颜色
      // if (proxy.subDiv) proxy.subDiv.style.color = color;

      // 关系文字颜色
      // if (proxy.lineSvg) {
      //   let texts = proxy.lineSvg.getElementsByTagName("text");
      //   texts.forEach(o => {
      //     o.style.setProperty("fill", textColor);
      //   });
      // }
    };

    const comptLoaded = () => {
      // console.log('text-comptLoaded');
      if (itemRefs.value.filter((o) => o.belongType && o.belongType(BaseCompt)).every((o) => o.isLoaded)) {
        // console.log('text-comptLoaded-all');

        childrenLoaded.value = true;
      }
    };
    watch([childrenLoaded, lineLoaded], (nv) => {
      // if (proxy.isMainSent) console.log(proxy.$el, nv);
      if (nv && nv[0] && nv[1]) {
        proxy.isLoaded = true;
        itemRefs.value.forEach((o) => (o.isLoaded = false));
        ctx.emit('compt-loaded');

        if (nv[1] && props.parentCompt) {
          props.parentCompt.loadChildLineCompt();
        }
      }
    });

    const setSentBias = (bias) => {
      // console.log(bias);
      hErClass.value = bias != '' ? 'gc-error' : '';
      relErr.value = bias;
    };
    watch(relErr, (nv) => {
      errRight.value = -nv.length * 7;
    });

    // 清除对齐到自身的句子
    const clearAlignCompts = () => {
      if (
        proxy.belongIniType(XmlTags.O_Sent) &&
        props.parentCompt != null &&
        props.parentCompt.belongType(StackCompt)
      ) {
        let gcs = props.parentCompt.gridCompts().filter((o) => o != proxy);
        gcs.forEach((o) => {
          if (o.alignCompt) {
            let act = o.alignCompt.getTopComptByType('GridCompt');
            if (act == proxy) {
              o.alignCompt = null;
              o.x = 0;
              o.aLineWidth = 0;
            }
          }
        });
      }
    };

    onBeforeUnmount(() => {
      clearLine();

      if (
        proxy.belongIniType(XmlTags.O_Sent) &&
        proxy.parentCompt != null &&
        proxy.parentCompt.belongType(StackCompt)
      ) {
        // 清除依赖于自身的句子的线条
        proxy.parentCompt.clearArcLine(proxy);

        // 重新计算线条
        proxy.diagram.computeComptMinWidth();
      }
    });

    return {
      ...BaseCompt.setup(props, ctx),

      comptTypes,
      ignore,
      items,
      itemRefs,
      sameAlignCompts,
      isFold,
      showExpand,
      aLineWidth,
      pointClass,
      wholeText,
      sentId,
      expandClass,
      paddingStyle,
      alignStyle,
      layoutDiv,
      tipContent,
      hLineClass,
      hErClass,
      relErr,
      errRight,
      hLine,
      sepClass,
      indRClass,
      lineLoaded,
      isUpdated,

      initialLine,
      clearLine,
      setLineColor,
      expandAll,
      expandGrid,
      onMouseUp,
      comptLoaded,
      parseIndent,
      toXml,
      fromXml,
      clearAlignCompts,
      setSentBias,
    };
  },

  computed: {
    childrenItems: {
      get: function () {
        // console.log(this);
        // console.log(this.itemRefs);
        return this.itemRefs
          .filter((o) => o.belongType)
          .slice(0)
          .sort((a, b) => a.column - b.column);
        // return this.$children[0].$children
        //   .filter((o) => !o.belongType('QTooltip'))
        //   .slice(0)
        //   .sort((a, b) => a.column - b.column);
      },
      cache: false,
    },

    cornerCompt: {
      cache: false, //禁用缓存
      get: function () {
        let children = this.childrenItems;
        if (children != null && children.length > 0) {
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child != null && child.belongIniType(XmlTags.C_UU)) return child;
          }
        }
        return null;
      },
    },

    // 是否含有待定成分
    hasGeneric: {
      get: function () {
        return this.childrenItems.some((o) => o.belongIniType(XmlTags.O_Temp));
      },
      cache: false,
    },
  },

  methods: {
    addObjTc(col) {
      GridUtil.addColumn(this, col);
      GridUtil.addItem(TextCompt, this, 1, col, XmlTags.C_Bin);
      GridUtil.addColumn(this, col);
      GridUtil.addItem(ObjSep, this, 1, col);
      this.$nextTick(() => {
        let tc = this.childrenItems.find((o) => o.column == col + 1 && o.belongType(TextCompt));
        if (tc != null) {
          tc.active();
        }
      });
    },

    addUniTc(col) {
      GridUtil.insertItem(TextCompt, this, 1, col, XmlTags.V_Fun_UNI, null, '', null, TextType.VIRTUAL, 1);
      this.$nextTick(() => {
        let tc = this.childrenItems.find((o) => o.column == col && o.belongType(TextCompt));
        if (tc != undefined) {
          tc.active();
        }
      });
    },

    removeUniTc(col) {
      let items = this.items;
      let item = items.find((o) => o.column == col && o.component != null && o.component.name == TextCompt.name);
      if (item == null || item.text != '') return false;

      items.splice(items.indexOf(item), 1);
      return true;
    },

    // 文本框类型转换
    changeTcType(col, type) {
      let newType = '';
      let compt = this.childrenItems.find((o) => o.column == col && o.belongType(BaseCompt));
      if (compt == null) return newType;

      switch (type) {
        case XmlTags.V_Fun_COO:
          newType = XmlTags.V_Fun_APP;
          break;
        case XmlTags.V_Fun_APP:
          newType = XmlTags.V_Fun_COO;
          break;

        // 句首CC和PP切换
        case XmlTags.C_PP:
        case XmlTags.C_CC:
          let belongNp = compt.rightCompts().firstOrDefault((o) => o.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin));
          if (belongNp == null || belongNp.iniType == XmlTags.C_Bin) return newType;

          // 联合成分中间的介词不能转化
          let leftCompt = compt.nearestLeftCompt();
          if (leftCompt != null && leftCompt.belongIniType(XmlTags.V_Fun_APP, XmlTags.V_Fun_COO)) return newType;

          let rightCompt = compt.nearestRightCompt();
          if (rightCompt.belongIniType(XmlTags.C_Zhuang, XmlTags.C_Ind, XmlTags.C_PP, XmlTags.C_CC)) return newType;

          newType = type == XmlTags.C_CC ? XmlTags.C_PP : XmlTags.C_CC;
          break;

        // UN和UV切换
        case XmlTags.C_UN:
        case XmlTags.C_UV:
          let leftPrd = compt.nearestLeftCompt(XmlTags.C_Wei);
          leftCompt = compt.nearestLeftCompt();
          rightCompt = compt.nearestRightCompt();
          let rcs = compt.rightCompts('PrdSep');

          // C1： 附加成分中（单个TextCompt+助的情况） 宾助↔谓助
          let tLen = this.childrenItems.filter((o) => o.belongType(BaseCompt)).length;
          if (
            this.belongIniType(XmlTags.C_Sub) &&
            (tLen ==
              this.childrenItems.filter(
                (o) => o.belongType(TextCompt) && o.belongIniType(XmlTags.C_Bin, XmlTags.C_UN, XmlTags.C_UU)
              ).length ||
              tLen ==
                this.childrenItems.filter(
                  (o) => o.belongType(TextCompt) && o.belongIniType(XmlTags.C_Wei, XmlTags.C_UV, XmlTags.C_UU)
                ).length)
          ) {
            let c1 = this.childrenItems.find((o) => o.belongIniType(XmlTags.C_Bin, XmlTags.C_Wei));
            if (type == XmlTags.C_UN) {
              newType = XmlTags.C_UV;
              c1.updateParentItem('iniType', XmlTags.C_Wei);
            } else {
              newType = XmlTags.C_UN;
              c1.updateParentItem('iniType', XmlTags.C_Bin);
            }
            this.$nextTick(() => {
              c1.wordUnit.updateTypeBlock();
            });
          }
          // C2： 1.句末 2.联合谓语前一谓语辖域末位（1、2不考虑后续独立语） 3.句首主语前
          else if (
            (leftPrd != null &&
              leftCompt.iniType == XmlTags.C_Bin &&
              (rightCompt == null ||
                rightCompt.belongIniType(XmlTags.V_Fun_UNI, XmlTags.C_UU) ||
                rcs.every((o) => o.belongIniType(XmlTags.C_Ind)))) ||
            (leftCompt == null && rightCompt.iniType == XmlTags.C_Zhu)
          ) {
            newType = type == XmlTags.C_UN ? XmlTags.C_UV : XmlTags.C_UN;
          } else return newType;
          break;
      }

      if (newType != '') {
        let items = this.items.filter((o) => o.column == col && o.component != null);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.component.name == TextCompt.name) item.iniType = newType;
          else item.iniType = newType;
        }

        let editor = this.editor;
        if (editor != null && editor.activeComponent == compt) editor.updateAcFloatInfo();

        if (compt.wordUnit != null)
          this.$nextTick(() => {
            compt.wordUnit.updateTypeBlock();
          });
      }

      return newType;
    },

    findChild(row, column, type) {
      let queryRow = row != null && row > -1;
      let queryCol = column != null && column > -1;
      let queryType = type != null && type.name != null;
      return this.childrenItems.find(
        (o) => (!queryRow || o.row == row) && (!queryCol || o.column == column) && (!queryType || o.belongType(type))
      );
    },

    existChildNode(node, className) {
      var patt = new RegExp(className);
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (patt.test(child.className)) return true;
      }
      return false;
    },

    textExtract(textRegion, isCut) {
      let text = '';
      let items = this.childrenItems.sort((a, b) => a.column - b.column);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.belongType(BaseCompt)) text += item.textExtract(textRegion, isCut);
      }
      return text;
    },

    textFill(text, textRegion) {
      if (text == null) return;
      let tt = text.trim();
      let reg_duu = new RegExp('.+((?<!似)的|之)[\\s、，）]*$');
      let reg_zuu = new RegExp('.+(地|(?<!似)的)[\\s、，）]*$');
      // 定、状 角助词
      if (
        (this.iniType == XmlTags.C_Ding && reg_duu.test(tt)) ||
        (this.iniType == XmlTags.C_Zhuang && reg_zuu.test(tt))
      ) {
        let regUU = new RegExp('(.+)([的之地][\\s、，）]*)');
        let match = tt.match(regUU);
        let corner = this.childrenItems.firstOrDefault((o) => o.textType == TextType.VIRTUAL_CORNER);
        if (corner != null && match.length > 2) {
          corner.textFill(match[2], TextRegion.ALL);
          tt = match[1];
        }
      }
      // 补语 角助词
      else if (this.iniType == XmlTags.C_Bu && /^[得的]/.test(tt)) {
        let t1 = tt.substring(0, 1);
        let corner = this.childrenItems.firstOrDefault((o) => o.textType == TextType.VIRTUAL_CORNER);
        if (corner != null) {
          corner.textFill(t1, TextRegion.ALL);
          tt = tt.substring(1);
        }
      }

      this.mergeTextFill(tt, textRegion, 0, true);
    },

    // target: -1表示最后一个非空元素处理逻辑
    mergeTextFill(text, textRegion, target = 0, fullFill = false) {
      if (text == null) return;

      let tt = text.trim();
      let items = this.childrenItems
        .filter((o) => o.textType != TextType.VIRTUAL_CORNER && o.belongType(BaseCompt))
        .sort((a, b) => a.column - b.column);
      let item;
      if (target == -1) {
        let last = items.lastOrDefault();
        // 最后一个是宾语，非联合结构且为空的时候，向前查找非空或非宾语的元素
        if (
          last.belongIniType(XmlTags.C_Bin) &&
          GridUtil.posInUni(last) == UniPos.ONLY &&
          last.toXml().textContent == ''
        ) {
          item = items.lastOrDefault((o) => o.toXml().textContent != '' || !o.belongIniType(XmlTags.C_Bin));
        }
        if (item == null) item = last;
      } else if (textRegion == TextRegion.ALL) {
        item = items.firstOrDefault((o) => o.iniType == XmlTags.C_Wei);
      } else if (textRegion == TextRegion.BEHIND) item = items.lastOrDefault();

      if (
        target != -1 &&
        ((textRegion == TextRegion.BEHIND && this.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang)) ||
          (textRegion == TextRegion.FRONT && this.belongIniType(XmlTags.C_Bu)))
      ) {
        // 定、状从后向前合并时 或 补从前向后合并时， 需要把UU内容清空
        let corner = this.childrenItems.firstOrDefault((o) => o.textType == TextType.VIRTUAL_CORNER);
        if (corner != null && corner.text != '') {
          let uuText = corner.textExtract(TextRegion.ALL, true);
          tt = this.belongIniType(XmlTags.C_Bu) ? tt + uuText : uuText + tt;
        }
      }

      if (item == null) item = items.firstOrDefault();
      if (item != null) {
        if (fullFill) item.textFill(tt, textRegion);
        else item.mergeTextFill(tt, textRegion);
      }
    },

    autoParse() {
      // console.log("autoParse");
      let _this = this;
      let text = this.xml.textContent;
      let top = 0;
      let da = this.editor.diagramArea;
      if (da != null) {
        let point = this.getCursorPosition(da);
        if (point != null) top = point.y - da.scrollTop - 30;
      }
      this.diagram.loadCount++;
      this.$jbwApi
        .deepParse({ sent: text.trim(), take: 1, dictType: this.editor.dictType, base64: 1 })
        .then(function (response) {
          let data = response.data;
          // console.log(data);
          if (data != null && data.IsSuccess && data.Data != null && !_this._isDestroyed) {
            let d1 = decodeURIComponent(escape(window.atob(data.Data)));
            let xmlDoc = new DOMParser().parseFromString(d1, 'text/xml');
            if (xmlDoc.getElementsByTagName('parsererror').length == 0) {
              let child = xmlDoc.firstElementChild;
              child.elements(XmlTags.C_Sent).forEach((o) => {
                o.setAttribute(XmlTags.A_Id, _this.sentId);
              });
              _this.XmlParser.parseXml2Compt(_this, XmlTags.O_Sent, child);
              _this.editor.isSaved = false;
              // 自动分析后，滚动到顶端
              setTimeout(() => {
                if (top > 0) da.scrollTop += top;
              }, 100);
            }
          }
        })
        .catch(function (error) {
          // console.log(error);
        })
        .finally(function () {
          _this.diagram.loadCount--;
        });
    },

    active() {
      if (!this.ignore) {
        this.$nextTick(() => {
          this.editable = true;
          for (let i = 0; i < this.childrenItems.length; i++) {
            let item = this.childrenItems[i];
            item.active();
          }
        });
      }
      this.setLineColor(this.ignore ? 'transparent' : 'coral', 'red');
    },

    deActive(hideCode, hideTb) {
      this.$nextTick(() => {
        this.editable = false;
        for (let i = 0; i < this.childrenItems.length; i++) {
          let item = this.childrenItems[i];
          item.deActive(hideCode, hideTb);
        }
      });
      this.setLineColor(this.ignore ? 'transparent' : 'black', 'black');
    },
  },

  updated() {
    this.$nextTick(() => {
      if (!this.isUpdated) {
        this.$emit('GridUpdated');
      }
      this.isUpdated = true;
    });

    // 水平拖动主句时，动态调整边界框
    if (this.belongIniType(XmlTags.O_Sent) && this.parentCompt != null && this.parentCompt.belongType(StackCompt)) {
      this.diagram.computeComptMinWidth();
    }
  },

  components: {
    VueDraggableResizable,
    //  QTooltip
  },
};
</script>