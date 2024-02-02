import GlobalConst from '../enum/global_variable';
import XmlTags from './xml_tags.js';
import ExprTags from './expr_tags.js';
import TextType from '../enum/text_type';
import PrdExtend from '../enum/prd_extend';
import UniPos from '../enum/uni_pos';

import Diagram from '../components/Diagram.vue';
import BaseCompt from '../components/BaseCompt.vue';
import TextCompt from '../components/TextCompt.vue';
import GridCompt from '../components/GridCompt.vue';
import StackCompt from '../components/StackCompt.vue';
import SbjSep from '../components/assist/SbjSep.vue';
import PrdSep from '../components/assist/PrdSep.vue';
import ObjSep from '../components/assist/ObjSep.vue';
import FillLifter from '../components/assist/FillLifter.vue';

import XmlExtends from './xml_extends';
import { VueElement as Vue } from 'vue';
// import SentBuilder from './sent_builder.js';

// const LoArray = require('lodash/array');
// const LoCollection = require('lodash/collection');
import LoArray from 'lodash/array';
import LoCollection from 'lodash/collection';

const PrdExt2Expr = {};
PrdExt2Expr[XmlTags.V_Fun_SYN] = ExprTags.Syn_CC_SYN;
PrdExt2Expr[XmlTags.V_Fun_PVT] = ExprTags.Syn_CC_PVT;
PrdExt2Expr[XmlTags.V_Fun_SER] = ExprTags.Syn_CC_SER;
PrdExt2Expr[XmlTags.V_Fun_UNI] = ExprTags.Syn_CC_Uni_L;

function generateKey() {
  return (Math.random() + 1) * 1000;
}

/**
 * 增加一列
 * 注意：childrenItems里面的VueComponent元素不会减少，需要等待$nextTick后才会更新
 *      后续addRow、delColumn、delRow等与此情况相同
 * @param {BaseCompt} compt
 * @param {Number} col
 * @returns
 */
function addColumn(compt, col) {
  let items = compt.items;
  // console.log(items, items.length);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item != null &&
      item.column >= col &&
      item.column != GlobalConst.GridMaxCol
    ) {
      item.column++;
    }
  }
  // compt.items.map(o => console.log(o.column + o.iniType + o.text));
}

function addRow(compt, row) {
  let items = compt.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item != null && item.row >= row) {
      item.row++;
    }
  }
}

function delColumn(compt, col) {
  // console.log(col)
  if (compt == null || compt.items == null || compt.items.length == 0) return;

  let items = compt.items;
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item != null && item.column == col) {
      items.splice(index, 1);
      index--;
      // item.component = null;  //调用删除后WordUnit文字text绑定更新会错位，先置为null（因为key相同而导致）
    } else if (
      item != null &&
      item.column > col &&
      item.column != GlobalConst.GridMaxCol
    ) {
      item.column--;
    }
  }
}

function delRow(compt, row) {
  if (compt == null || compt.items == null || compt.items.length == 0) return;

  let items = compt.items;
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (item != null && item.row == row) {
      items.splice(index, 1);
      index--;
    } else if (item != null && item.row > row) {
      item.row--;
    }
  }
}

/**
 *
 * @param {VueComponent} component
 * @param {VueComponent} parentCompt
 * @param {Number} row
 * @param {Number} column
 * @param {String} iniType
 * @param {Element} xml
 * @param {String} text
 * @param {Array} iniItems
 * @param {TextType} textType
 */
function addItem(
  component,
  parentCompt,
  row,
  column,
  iniType,
  xml,
  text,
  iniItems,
  textType
) {
  if (iniType == undefined) iniType = '';
  if (xml == undefined) xml = null;
  if (text == undefined) text = '';
  if (textType == undefined) textType = TextType.SOLID;

  let item = {
    key: generateKey(),
    component: component,
    parentCompt: parentCompt,
    row: row,
    column: column,
    iniType: iniType,
    xml: xml,
    text: text,
    iniItems: iniItems,
    textType: textType,
    style: {},
  };

  parentCompt.items.push(item);
}

function insertItem(
  component,
  parentCompt,
  row,
  column,
  iniType,
  xml,
  text,
  iniItems,
  textType,
  idx
) {
  if (iniType == undefined) iniType = '';
  if (xml == undefined) xml = null;
  if (text == undefined) text = '';
  if (textType == undefined) textType = TextType.SOLID;

  let item = {
    key: generateKey(),
    component: component,
    parentCompt: parentCompt,
    row: row,
    column: column,
    iniType: iniType,
    xml: xml,
    text: text,
    iniItems: iniItems,
    textType: textType,
  };

  parentCompt.items.splice(idx, 0, item);
}

/**
 * 按对象处理，增加compt.childrenItems的column
 * @param {VueComponent} compt
 * @param {Number} col
 */
function addColumnV2(compt, col) {
  let items = compt.childrenItems;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item != null &&
      item.column >= col &&
      item.column != GlobalConst.GridMaxCol
    ) {
      item.column++;
    }
  }
}

/**
 * 按对象处理，向compt中挂载childCompt，并添加到childrenItems
 * @param {VueComponent} compt
 * @param {VueComponent} childCompt
 */
function addItemV2(compt, childCompt) {
  if (compt.belongType(GridCompt)) {
    compt.$refs.gridcompt.append(childCompt.$el);
  } else if (compt.belongType(StackCompt)) {
    compt.$refs.stackCompt.append(childCompt.$el);
  }
  compt.childrenItems.push(childCompt);
  childCompt.$parent = compt;
}

/**
 *
 * @param {VueComponent} compt
 * @returns
 */
function cloneItem(compt) {
  let nItems = [...compt.items];
  let item = {
    key: generateKey(),
    component: compt.$options.name,
    parentCompt: compt.parentCompt,
    row: compt.row,
    column: compt.column,
    iniType: compt.iniType,
    xml: compt.xml,
    text: compt.text,
    iniItems: nItems,
    textType: compt.textType,
  };

  return item;
}

/**
 * 从compt.childrenItems中查找column在(start, end]范围内的首个成分
 * @param {VueComponent} compt
 * @param {Number} start
 * @param {Number} end
 * @param {String} type 查找的成分类型
 * @returns
 */
function findElemByCol(compt, start, end, type) {
  if (compt == null || compt.childrenItems == null) return null;

  if (type != null)
    return compt.childrenItems.find(
      (o) => o.column >= start && o.column <= end && o.belongType(type)
    );

  return compt.childrenItems.find((o) => o.column >= start && o.column <= end);
}

/**
 * 从compt.childrenItems中查找column在(start, end]范围内的所有成分
 * @param {VueComponent} compt
 * @param {Number} start
 * @param {Number} end
 * @param {String} type 查找的成分类型
 * @returns
 */
function findElemsByCol(compt, start, end, type) {
  if (compt == null || compt.childrenItems == null) return [];

  if (start == null) start = 1;
  if (end == null) end = GlobalConst.GridMaxCol;

  let children = compt.childrenItems.sort((a, b) => a.column - b.column);
  if (type != null)
    return children.filter(
      (o) => o.column >= start && o.column <= end && o.belongType(type)
    );

  return children.filter((o) => o.column >= start && o.column <= end);
}

/**
 * 从compt.childrenItems中查找row在(start, end]范围内的所有成分
 * @param {VueComponent} compt
 * @param {Number} start
 * @param {Number} end
 * @param {String} type 查找的成分类型
 * @returns
 */
function findElemsByRow(compt, start, end, type) {
  if (compt == null || compt.childrenItems == null) return [];

  if (start == null) start = 1;
  if (end == null) end = GlobalConst.GridMaxCol;

  let children = compt.childrenItems.sort((a, b) => a.row - b.row);
  if (type != null)
    return children.filter(
      (o) => o.row >= start && o.row <= end && o.belongType(type)
    );

  return children.filter((o) => o.row >= start && o.row <= end);
}

/**
 *
 * @returns Array
 */
function iniSVOItems() {
  let items = [];
  let col = GlobalConst.DefaultStartCol;
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Zhu,
    text: '',
    textType: TextType.SOLID,
  });
  items.push({
    component: SbjSep,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: '',
  });
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Wei,
    text: '',
    textType: TextType.SOLID,
  });
  items.push({
    component: ObjSep,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: '',
  });
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Bin,
    text: '',
    textType: TextType.SOLID,
  });
  return items;
}

/**
 *
 * @returns Array
 */
function iniSLVItems(text) {
  let items = [];
  let col = GlobalConst.DefaultStartCol;
  if (text == undefined) text = '';
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Zhu,
    text: '',
    textType: TextType.SOLID,
  });
  items.push({
    component: SbjSep,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: '',
  });
  items.push({
    component: FillLifter,
    row: 3,
    column: col++,
  });
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Wei,
    text: text,
    textType: TextType.SOLID,
  });
  return items;
}

/**
 *
 * @returns Array
 */
function iniSVItems() {
  let items = [];
  let col = GlobalConst.DefaultStartCol;
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Zhu,
    text: '',
    textType: TextType.SOLID,
  });
  items.push({
    component: SbjSep,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: '',
  });
  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Wei,
    text: '',
    textType: TextType.SOLID,
  });
  return items;
}

/**
 *
 * @returns Array
 */
function iniVItems() {
  let items = [];
  let col = GlobalConst.DefaultStartCol;

  items.push({
    key: generateKey(),
    component: TextCompt,
    parentCompt: null,
    row: 1,
    column: col++,
    iniType: XmlTags.C_Wei,
    text: '',
    textType: TextType.SOLID,
  });
  return items;
}

/**
 * 返回GridCompt的iniItems，后期可按需把iniSVOItems等方法逻辑合并进来
 * @param {String} type 定、状、补、小句、顶起小句等
 * @returns Array
 */
function iniGridComptItems(type) {
  let items = [];
  switch (type) {
    case XmlTags.C_Ding:
    case XmlTags.C_Zhuang:
      items.push({
        key: generateKey(),
        component: TextCompt,
        parentCompt: null,
        row: 1,
        column: GlobalConst.DefaultStartCol,
        iniType: XmlTags.O_Temp,
        text: '',
        textType: TextType.SOLID,
      });
      items.push({
        key: generateKey(),
        component: TextCompt,
        parentCompt: null,
        row: 1,
        column: GlobalConst.GridMaxCol,
        iniType: XmlTags.C_UU,
        text: '',
        textType: TextType.VIRTUAL_CORNER,
      });
      break;

    case XmlTags.C_Bu:
      items.push({
        key: generateKey(),
        component: TextCompt,
        parentCompt: null,
        row: 1,
        column: 1,
        iniType: XmlTags.C_UU,
        text: '',
        textType: TextType.VIRTUAL_CORNER,
      });
      items.push({
        key: generateKey(),
        component: TextCompt,
        parentCompt: null,
        row: 1,
        column: 3,
        iniType: XmlTags.O_Temp,
        text: '',
        textType: TextType.SOLID,
      });
      break;

    case XmlTags.C_Ind:
      items.push({
        key: generateKey(),
        component: TextCompt,
        parentCompt: null,
        row: 1,
        column: GlobalConst.DefaultStartCol,
        iniType: XmlTags.O_Temp,
        text: '',
        textType: TextType.SOLID,
      });
      break;
  }

  return items;
}

/**
 * 判断compt在并列或同位结构中所处位置
 * @param {VueComponent} compt
 * @returns UniPos
 */
function posInUni(compt) {
  if (compt.iniType != XmlTags.C_Zhu && compt.iniType != XmlTags.C_Bin)
    return UniPos.NULL;

  let col = compt.column;
  let start = col - compt.leftRegion(1);
  let end = col + compt.rightRegion(1);

  let cps = compt.parentCompt.childrenItems
    .filter(
      (o) => o.iniType == compt.iniType && o.column >= start && o.column <= end
    )
    .sort((a, b) => a.column - b.column);

  if (cps.length == 1) return UniPos.ONLY;
  else if (cps.length > 1) {
    if (cps.firstOrDefault() == compt) return UniPos.FIRST;
    else if (cps.lastOrDefault() == compt) return UniPos.LAST;
    else return UniPos.CENTER;
  }

  return UniPos.NULL;
}

/**
 * 返回当前成分的上下文信息
 * @param {VueComponent} compt
 * @param {Boolean} withSeptorPrd
 * @param {Boolean} ignoreBlank 忽略空白成分
 * @returns
 */
function contextOfPrd(compt, withSeptorPrd, ignoreBlank) {
  if (
    compt == null ||
    compt.iniType != XmlTags.C_Wei ||
    compt.parentCompt == null
  )
    return null;

  if (withSeptorPrd == undefined) withSeptorPrd = true;
  if (ignoreBlank == undefined) ignoreBlank = true;

  let context = '';
  let leftCompts = compt.leftCompts(PrdSep);
  // console.log(leftCompts);
  if (leftCompts.some((o) => o.iniType == XmlTags.C_Zhu)) {
    leftCompts = LoArray.dropWhile(leftCompts, (p) =>
      p.belongIniType(XmlTags.C_CC, XmlTags.C_Ind, XmlTags.C_Zhuang)
    );
    let firstSbj = leftCompts.firstOrDefault((p) => p.iniType == XmlTags.C_Zhu);
    if (
      leftCompts.some((o) =>
        o.belongIniType(
          XmlTags.C_Ding,
          XmlTags.V_Fun_COO,
          XmlTags.V_Fun_APP,
          XmlTags.C_PP,
          XmlTags.C_FF,
          XmlTags.C_UN
        )
      ) ||
      !firstSbj.belongType(TextCompt) ||
      firstSbj.text.length > 0 ||
      (firstSbj.text.length == 0 && !ignoreBlank)
    )
      context += 'S';

    // console.log(context);
    leftCompts = LoArray.dropWhile(leftCompts, (p) =>
      p.belongIniType(
        XmlTags.C_Zhu,
        XmlTags.C_Ding,
        XmlTags.V_Fun_COO,
        XmlTags.V_Fun_APP,
        XmlTags.C_PP,
        XmlTags.C_FF,
        XmlTags.C_UN
      )
    );
  }

  leftCompts.forEach((c) => {
    switch (c.iniType) {
      case XmlTags.C_Zhuang:
        context += 'D';
        break;
      case XmlTags.C_Ind:
        context += 'I';
        break;
      case XmlTags.C_CC:
        context += ExprTags.Syn_CC_L;
        break;
    }
  });

  context += 'V';
  // console.log(context);

  let rightCompts = compt.rightCompts(PrdSep);
  // console.log(rightCompts);
  let npMulti = false;
  rightCompts.forEach((c) => {
    switch (c.iniType) {
      case XmlTags.V_Fun_COO:
      case XmlTags.V_Fun_APP:
        npMulti = true;
        break;
      case XmlTags.C_Bin:
        if (!npMulti) context += 'O';
        npMulti = false;
        break;
      case XmlTags.C_Bu:
        context += 'C';
        break;
      case XmlTags.C_UV:
        context += ExprTags.Syn_UV_L;
        break;
    }
  });

  // console.log(context);
  var nrCompt = compt.nearestRightCompt();
  if (
    nrCompt != null &&
    nrCompt.belongIniType(XmlTags.C_Bin) &&
    nrCompt.text.length == 0 &&
    ignoreBlank
  )
    context = context.replace('VO', 'V');

  if (withSeptorPrd) {
    let idx = compt.column;
    let pCompt = compt.parentCompt;
    var prdSeps = pCompt.childrenItems
      .filter((o) => o.belongType(PrdSep))
      .sort((a, b) => a.column - b.column);
    var leftPrdSep = prdSeps.lastOrDefault((o) => o.column < idx);
    if (
      leftPrdSep != undefined &&
      PrdExt2Expr.hasOwnProperty(leftPrdSep.iniType.toUpperCase())
    )
      context = PrdExt2Expr[leftPrdSep.iniType.toUpperCase()] + context;

    var rightPrdSep = prdSeps.firstOrDefault((o) => o.column > idx);
    if (
      rightPrdSep != undefined &&
      PrdExt2Expr.hasOwnProperty(rightPrdSep.iniType.toUpperCase())
    )
      context += PrdExt2Expr[rightPrdSep.iniType.toUpperCase()];
  }

  // console.log(context);
  return context;
}

/**
 * 移除compt在[start, end]范围内的assist及其compt
 * @param {VueComponent} compt
 * @param {String} type SbjSep ObjSep
 * @param {Number} start column开始位置
 * @param {Number} end column结束位置
 * @returns 移除方法作用的范围
 */
function removeAssist(compt, type, start, end) {
  let span = 0;
  if (compt == null || (type != SbjSep && type != ObjSep)) return span;

  let items = compt.items
    .filter((o) => o.column >= start && o.column <= end && o.component != null)
    .sort((a, b) => a.column - b.column);

  let assist = items.find((o) => o.component == type);
  if (assist == undefined) return span;

  if (type == SbjSep) {
    //暂未考虑主语前切成分
    let sbj = items.find((o) => o.iniType == XmlTags.C_Zhu);
    if (sbj == undefined) return span;
    span = assist.column - sbj.column + 1;
    for (let i = 0; i < span; i++) {
      delColumn(compt, sbj.column);
    }
  } else if (type == ObjSep) {
    //暂未考虑宾语后切成分
    let obj = items.lastOrDefault((o) => o.iniType == XmlTags.C_Bin);
    if (obj == undefined) return span;
    span = obj.column - assist.column + 1;
    for (let i = 0; i < span; i++) {
      delColumn(compt, assist.column);
    }
  }
  // console.log(assist);
  return span;
}

/**
 * 检测设置GridCompt的支架
 * @param {VueComponent} compt
 */
function checkLifter(compt) {
  if (compt == null) return;

  setLifter(compt, false);
  if (
    !compt.isInStack &&
    compt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin)
  )
    setLifter(compt, true);
}

/**
 * 添加/移除  顶起的支架
 * @param {VueComponent} compt
 * @param {Boolean} add true为添加，false为移除
 */
function setLifter(compt, add) {
  if (compt == null) return;
  if (compt.items == null || compt.items.length == 0) return;

  let items = compt.items;
  let lifters = items.filter(
    (o) => o.component != null && o.component.name == 'FillLifter'
  );
  if (add) {
    if (lifters.length > 0) return;

    let sbjSeps = items
      .sort((a, b) => a.column - b.column)
      .filter((o) => o.component != null && o.component.name == 'SbjSep');

    let idx =
      sbjSeps.length > 0
        ? sbjSeps.firstOrDefault().column + 1
        : GlobalConst.DefaultStartCol;
    addColumn(compt, idx);
    addItem(FillLifter, compt, 3, idx);
  } else {
    for (let i = 0; i < lifters.length; i++) {
      const lifter = lifters[i];
      delColumn(compt, lifter.column);
    }
  }
}

/**
 * StackCompt转GridCompt
 * @param {VueComponent} compt
 * @param {Number} row 保留成分所在行
 */
function stack2Grid(compt, row) {
  if (compt == null || compt.items.length > 1) return;

  let grid = compt.gridCompts().find((o) => o.row != row);
  let xml = grid.toXml().cloneNode(true);
  // 最外层复句
  if (compt.parentCompt == null) {
    let diagram = compt.ancestor(Diagram);
    diagram.type = GridCompt;
    diagram.xml = xml;
    diagram.compt.items = [];
    diagram.$nextTick(() => {
      diagram.compt.fromXml();
    });
  }
  // 成份里的复句
  else {
    let pCompt = compt.parentCompt;
    let col = compt.column;
    let row = compt.row;
    delColumn(pCompt, col);
    addColumn(pCompt, col);
    if (compt.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Bu)) {
      let corner = compt.cornerCompt;
      xml = XmlExtends.adjustStack2Grid(xml, corner.toXml());
    }
    addItem(GridCompt, pCompt, row, col, compt.iniType, xml);

    pCompt.$nextTick(() => {
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.row == row
      );
      if (newCompt != null) {
        newCompt.fromXml();

        // 附加成分考虑子成分类型转化
        if (newCompt.belongIniType(XmlTags.C_Sub)) {
          newCompt.$nextTick(() => {
            // SentBuilder.updateChildrenType(newCompt);
          });
        }
      }
    });
  }

  return;
}

//#region 扩展方法
/**
 * 从GridCompt或StackCompt中查找子成分
 * @param {Number} row
 * @param {Number} column
 * @param {String} type 成分类型，如TextCompt，SbjSep
 * @returns
 */
const getChild = function (row, column, type) {
  if (this.childrenItems == null) return null;

  if (type != null)
    return this.childrenItems.find(
      (o) => o.column == column && o.row == row && o.belongType(type)
    );

  return this.childrenItems.find((o) => o.column == column && o.row == row);
};
Vue.prototype.getChild = getChild;

/**
 * 左边的子元素个数
 * @param {Number} ignoreCoo //是否跨过并列和同位 1-是，0-否
 * @param {Number} withSeptor//是否包含宾语分隔符 1-是，0-否
 * @param {Number} withLifter//是否包含顶起 1-是，0-否
 * @returns
 */
const leftRegion = function (ignoreCoo, withSeptor, withLifter) {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return 0;

  if (ignoreCoo == undefined || ignoreCoo == null) ignoreCoo = 0;
  if (withSeptor == undefined || withSeptor == null) withSeptor = 1;
  if (withLifter == undefined || withLifter == null) withLifter = 1;

  // 补语整体为GridCompt时，需要考虑开头col位置
  let pIsBu =
    this.parentCompt.belongIniType(XmlTags.C_Bu) && !this.parentCompt.isInStack;
  let colIdx = this.column;
  let items = this.parentCompt.childrenItems
    .filter((o) => o.column < colIdx)
    .sort((a, b) => b.column - a.column);

  if (this.iniType == XmlTags.C_Zhu) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let iniType = item.iniType == undefined ? '' : item.iniType;
      let iniTypeUp = iniType == undefined ? '' : iniType.toUpperCase();
      let idx = item.column;
      if (
        //同位、并列
        (ignoreCoo == 0 &&
          (iniTypeUp == XmlTags.V_Fun_COO || iniTypeUp == XmlTags.V_Fun_APP)) ||
        //句首连词、状语、独立语    谓语分隔符
        iniType == XmlTags.C_CC ||
        iniType == XmlTags.C_Zhuang ||
        iniType == XmlTags.C_Ind ||
        item.belongType(PrdSep)
      )
        return colIdx - idx - 1;
    }
    return (
      colIdx - (pIsBu ? GlobalConst.BuStartCol : GlobalConst.DefaultStartCol)
    );
  } else if (this.iniType == XmlTags.C_Bin) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let iniType = item.iniType == undefined ? '' : item.iniType;
      let iniTypeUp = iniType == undefined ? '' : iniType.toUpperCase();
      let idx = item.column;
      if (
        //同位、并列
        (ignoreCoo == 0 &&
          (iniTypeUp == XmlTags.V_Fun_COO || iniTypeUp == XmlTags.V_Fun_APP)) ||
        iniType == XmlTags.C_CC
      )
        return colIdx - idx - 1;
      // 介词只会出现在开始位置
      else if (iniType == XmlTags.C_PP && posInUni(item) == UniPos.FIRST)
        return colIdx - idx;
      else if (item.belongType(ObjSep))
        return withSeptor == 1 ? colIdx - idx : colIdx - idx - 1;
    }

    return (
      colIdx - (pIsBu ? GlobalConst.BuStartCol : GlobalConst.DefaultStartCol)
    );
  } else if (this.iniType == XmlTags.C_Wei) {
    // console.log("left-prd");
    if (withSeptor == 0) return 0; //??withSeptor含义及逻辑待确认

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let iniType = item.iniType == undefined ? '' : item.iniType;
      let idx = item.column;

      // console.log(item.$options.name);
      // console.log(idx);
      if (
        item.belongType(SbjSep, PrdSep) ||
        iniType == XmlTags.C_UN ||
        iniType == XmlTags.C_FF
      )
        return colIdx - idx - 1;
      else if (item.belongType(FillLifter))
        return colIdx - idx - (withLifter == 1 ? 0 : 1);
    }

    return (
      colIdx - (pIsBu ? GlobalConst.BuStartCol : GlobalConst.DefaultStartCol)
    );
  }
  return 0;
};
Vue.prototype.leftRegion = leftRegion;

/**
 * 从当前成分向左开始查找，直到遇到$options.name=untilType时停止
 * @param {VueComponent} untilType
 * @returns
 */
const leftCompts = function (untilType) {
  let pCompt = this.parentCompt;
  if (pCompt == null) return null;

  let items = this.leftElems(untilType);
  if (items == null) return null;

  return items.filter((o) => o.belongType(BaseCompt));
};
Vue.prototype.leftCompts = leftCompts;

/**
 * 从当前成分向右开始查找，直到遇到$options.name=untilType时停止
 * @param {VueComponent} untilType
 * @returns VueComponent[]
 */
const leftElems = function (untilType) {
  let pCompt = this.parentCompt;
  if (pCompt == null) return null;

  let idx = this.column;
  //按column正向排序后，保留小于idx的成分
  let items = LoArray.dropRightWhile(
    pCompt.childrenItems.sort((a, b) => a.column - b.column),
    (o) => o.column >= idx
  );

  if (untilType != undefined)
    return LoArray.takeRightWhile(items, (o) => !o.belongType(untilType));

  return items;
};
Vue.prototype.leftElems = leftElems;

/**
 * 获取当前compt左边范围内的NP成分
 * @returns VueComponent[]
 */
const leftNpCompts = function () {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let compts = [];
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => a.column - b.column
  );

  let col = this.column;
  let fr = this.leftRegion(1, 1, 0);
  // console.log("fr" + fr);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column >= col - fr &&
      item.column < col &&
      item.belongType(BaseCompt)
    ) {
      compts.push(item);
    }
  }
  return compts;
};
Vue.prototype.leftNpCompts = leftNpCompts;

/**
 * 获取当前compt左边辖域内的成分
 * @returns VueComponent[]
 */
const leftRegionCompts = function () {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let compts = [];
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => a.column - b.column
  );

  let col = this.column;
  let fr = this.leftRegion(0, 1, 0);
  // console.log("fr" + fr);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column >= col - fr &&
      item.column < col &&
      item.belongType(BaseCompt)
    ) {
      compts.push(item);
    }
  }
  return compts;
};
Vue.prototype.leftRegionCompts = leftRegionCompts;

/**
 * 右边的子元素个数
 * @param {Number} ignoreCoo //是否跨过并列和同位 1-是，0-否
 * @param {Number} withSeptor//是否包含主语分隔符
 * @param {Number} includeUV//当前compt为谓语时，是否包含句末语气助词
 * @returns
 */
const rightRegion = function (ignoreCoo, withSeptor, includeUV) {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return 0;

  if (ignoreCoo == undefined || ignoreCoo == null) ignoreCoo = 0;
  if (withSeptor == undefined || withSeptor == null) withSeptor = 1;
  if (includeUV == undefined || includeUV == null) includeUV = 0;

  let pIsBu = this.parentCompt.belongIniType(XmlTags.C_Bu);
  let colIdx = this.column;
  let items = this.parentCompt.childrenItems
    .filter((o) => o.column > colIdx)
    .sort((a, b) => a.column - b.column);

  // console.log(items);
  if (this.iniType == XmlTags.C_Zhu) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let iniType = item.iniType == undefined ? '' : item.iniType;
      let iniTypeUp = iniType == undefined ? '' : iniType.toUpperCase();
      let idx = item.column;

      // console.log(idx);
      // console.log(colIdx);
      if (
        ignoreCoo == 0 &&
        (iniTypeUp == XmlTags.V_Fun_COO || iniTypeUp == XmlTags.V_Fun_APP)
      )
        return idx - colIdx - 1;
      // else if (elem.BelongType(typeof(FillDash)) || elem.BelongType(typeof(FillSolid)))
      //     return idx - colIdx - 1;
      else if (item.belongType(SbjSep))
        return withSeptor == 1 ? idx - colIdx : idx - colIdx - 1;
    }

    let groupObj = LoCollection.groupBy(
      this.parentCompt.childrenItems,
      'column'
    );
    let idx = pIsBu
      ? colIdx - GlobalConst.BuStartCol
      : colIdx - GlobalConst.DefaultStartCol;
    return Object.keys(groupObj).length - idx + 1;
  } else if (this.iniType == XmlTags.C_Bin) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let iniType = item.iniType == undefined ? '' : item.iniType;
      let iniTypeUp = iniType == undefined ? '' : iniType.toUpperCase();
      let idx = item.column;
      if (
        (ignoreCoo == 0 &&
          (iniTypeUp == XmlTags.V_Fun_COO || iniTypeUp == XmlTags.V_Fun_APP)) ||
        item.belongType(ObjSep, PrdSep) ||
        iniType == XmlTags.C_UV ||
        iniType == XmlTags.C_CC ||
        iniType == XmlTags.C_Zhuang ||
        iniType == XmlTags.C_Bu ||
        iniType == XmlTags.C_Ind
      )
        return idx - colIdx - 1;
    }

    let groupObj = LoCollection.groupBy(
      this.parentCompt.childrenItems,
      'column'
    );
    let idx = pIsBu
      ? colIdx - GlobalConst.BuStartCol
      : colIdx - GlobalConst.DefaultStartCol;
    return Object.keys(groupObj).length - idx + 1;
  } else if (this.iniType == XmlTags.C_Wei) {
    //当前compt之后的SeptorPrd
    var prdSeps = items.filter((o) => o.belongType(PrdSep));

    //介于当前compt和之后的SeptorPrd中间的成分
    var betweens = items
      .filter(
        (o) => prdSeps.length == 0 || o.column < prdSeps.firstOrDefault().column
      )
      .reverse();
    // console.log(betweens);
    if (betweens.length == 0) return 0;

    for (let i = 0; i < betweens.length; i++) {
      const between = betweens[i];
      if (
        between.iniType == XmlTags.C_Bin ||
        between.iniType == XmlTags.C_FF ||
        between.iniType == XmlTags.C_UN ||
        between.iniType == XmlTags.C_Bu /** 句末补语 */ ||
        between.iniType == XmlTags.C_Ind /** 句末独立语 */ ||
        (includeUV == 1 && between.iniType == XmlTags.C_UV)
      )
        return between.column - colIdx;
    }
  }

  return 0;
};
Vue.prototype.rightRegion = rightRegion;

/**
 * 从当前成分向右开始查找，直到遇到$options.name=untilType时停止
 * @param {VueComponent} untilType
 * @returns BaseCompt[]
 */
const rightCompts = function (untilType) {
  let items = this.rightElems(untilType);
  if (items == null) return null;

  return items.filter((o) => o.belongType(BaseCompt));
};
Vue.prototype.rightCompts = rightCompts;

/**
 * 从当前成分向右开始查找，直到遇到$options.name=untilType时停止
 * @param {VueComponent} untilType
 * @returns VueComponent[]
 */
const rightElems = function (untilType) {
  let pCompt = this.parentCompt;
  if (pCompt == null) return null;

  let idx = this.column;
  //按column正向排序后，保留大于idx的成分
  let items = LoArray.dropWhile(
    pCompt.childrenItems.sort((a, b) => a.column - b.column),
    (o) => o.column <= idx
  );

  if (untilType != undefined)
    return LoArray.takeWhile(items, (o) => !o.belongType(untilType));

  return items;
};
Vue.prototype.rightElems = rightElems;

/**
 * 获取当前compt右边的成分items
 * @returns Object[]
 */
const rightComptItems = function () {
  if (this.parentCompt == null || this.parentCompt.items == null) return null;

  let compts = [];
  let items = this.parentCompt.items;
  // this.parentCompt.items.map(o => console.log(o.column + o.iniType + o.text));
  // let items = this.parentCompt.items.sort((a, b) => a.column - b.column); //sort会触发数据更新bug
  // console.log(11);
  let col = this.column;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column > col &&
      item.component != null &&
      (item.component.name == 'TextCompt' ||
        item.component.name == 'GridCompt' ||
        item.component.name == 'StackCompt')
    ) {
      compts.push(item);
    }
  }
  return compts;
};
Vue.prototype.rightComptItems = rightComptItems;

/**
 * 获取当前compt右边范围内的NP成分
 * @returns VueComponent[]
 */
const rightNpCompts = function () {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let compts = [];
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => a.column - b.column
  );

  let col = this.column;
  let br = this.rightRegion(1, 0, 0);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item != null &&
      item.column > col &&
      item.column <= col + br &&
      item.belongType(BaseCompt, ObjSep)
    ) {
      compts.push(item);
    }
  }
  return compts;
};
Vue.prototype.rightNpCompts = rightNpCompts;

/**
 * 获取当前compt右边辖域内的Compt成分
 * @returns VueComponent[]
 */
const rightRegionCompts = function () {
  let rrs = this.rightRegionElems();
  if (rrs == null) return null;
  return rrs.filter((o) => o.belongType(BaseCompt));
};
Vue.prototype.rightRegionCompts = rightRegionCompts;

/**
 * 获取当前compt右边辖域内的组件（BaseCompt和ObjSep）
 * @returns VueComponent[]
 */
const rightRegionElems = function () {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let compts = [];
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => a.column - b.column
  );

  let col = this.column;
  let br = this.rightRegion(0, 1, 1);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item != null &&
      item.column > col &&
      item.column <= col + br &&
      item.belongType(BaseCompt, ObjSep)
    ) {
      compts.push(item);
    }
  }
  return compts;
};
Vue.prototype.rightRegionElems = rightRegionElems;

/**
 * 左边最邻近Compt
 * @param {String/VueComponent} iniType
 * @returns
 */
const nearestLeftCompt = function (iniType) {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let col = this.column;
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => b.column - a.column
  );
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column < col &&
      (iniType == undefined || item.belongIniType(iniType)) &&
      item.belongType(BaseCompt)
    ) {
      return item;
    }
  }

  return null;
};
Vue.prototype.nearestLeftCompt = nearestLeftCompt;

/**
 * 左边最邻近VueComponent
 * @param {String/VueComponent} iniType
 * @returns
 */
const nearestLeftElem = function (iniType) {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let col = this.column;
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => b.column - a.column
  );
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column < col &&
      (iniType == undefined || item.belongIniType(iniType))
    ) {
      return item;
    }
  }

  return null;
};
Vue.prototype.nearestLeftElem = nearestLeftElem;

/**
 * 右边最邻近Compt
 * @param {String/VueComponent} iniType
 * @returns
 */
const nearestRightCompt = function (iniType) {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let col = this.column;
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => a.column - b.column
  );
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column > col &&
      (iniType == undefined || item.belongIniType(iniType)) &&
      item.belongType(BaseCompt)
    ) {
      return item;
    }
  }

  return null;
};
Vue.prototype.nearestRightCompt = nearestRightCompt;

/**
 * 右边最邻近VueComponent
 * @param {String/VueComponent} iniType
 * @returns
 */
const nearestRightElem = function (iniType) {
  if (this.parentCompt == null || this.parentCompt.childrenItems == null)
    return null;

  let col = this.column;
  let items = this.parentCompt.childrenItems.sort(
    (a, b) => a.column - b.column
  );
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (
      item != null &&
      item.column > col &&
      (iniType == undefined || item.belongIniType(iniType))
    ) {
      return item;
    }
  }

  return null;
};
Vue.prototype.nearestRightElem = nearestRightElem;

/**
 * 获取所属的NP核心成分
 * @returns
 */
Vue.prototype.coreNpCompt = function () {};

/**
 * 获取成分的谓语性质
 * @returns {PrdExtend}
 */
const prdExtend = function () {
  if (this.iniType != XmlTags.C_Wei || this.parentCompt == null)
    return PrdExtend.NULL;

  let col = this.column;
  let rightPrds = this.parentCompt.childrenItems
    .sort((a, b) => a.column - b.column)
    .filter((o) => o.column > col && o.belongType(PrdSep));
  if (
    rightPrds.length > 0 &&
    rightPrds.firstOrDefault().prdType == XmlTags.V_Fun_SYN
  )
    return PrdExtend.SYN;

  let leftPrds = this.parentCompt.childrenItems
    .sort((a, b) => b.column - a.column)
    .filter(
      (o) =>
        o.column < col && o.belongType(PrdSep) && o.prdType != XmlTags.V_Fun_SYN
    );
  if (leftPrds.length > 0) return leftPrds.firstOrDefault().prdType;

  return PrdExtend.NORMAL;
};
Vue.prototype.prdExtend = prdExtend;

//#endregion

export default {
  generateKey,
  addColumn,
  addRow,
  delColumn,
  delRow,
  addItem,
  insertItem,
  cloneItem,
  findElemByCol,
  findElemsByCol,
  findElemsByRow,

  iniSVOItems,
  iniSLVItems,
  iniSVItems,
  iniVItems,
  iniGridComptItems,

  addColumnV2,
  addItemV2,

  posInUni,
  contextOfPrd,
  removeAssist,
  checkLifter,
  setLifter,
  stack2Grid,
};

export {
  getChild,
  leftCompts,
  leftElems,
  leftNpCompts,
  leftRegion,
  leftRegionCompts,
  nearestLeftCompt,
  nearestLeftElem,
  nearestRightCompt,
  nearestRightElem,
  prdExtend,
  rightComptItems,
  rightCompts,
  rightElems,
  rightNpCompts,
  rightRegion,
  rightRegionCompts,
  rightRegionElems,
};
