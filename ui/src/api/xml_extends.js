//重建层次结构前的预处理(递归)
function xmlAdjust(xml, moveElem = true) {
  // console.log(xml.cloneNode(true));
  let child = xml.firstElementChild;
  while (child != null) {
    let tChild = child.nextElementSibling;
    xmlAdjust(child, moveElem);

    if (child.tagName == XmlTags.C_Wei) {
      let sbjs = xml.elements(XmlTags.C_Zhu);
      for (let i = 0; i < sbjs.length; i++) {
        const sbj = sbjs[i];
        //主语前有连词、状语、独立语，不能出主语倒装
        //1.前面有联合谓语标记，且主语和标记间有谓语
        let ccUni = sbj
          .elementsBeforeSelf(XmlTags.C_CC)
          .lastOrDefault((p) => p.hasAttribute(XmlTags.A_Fun) && p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_UNI);
        if (ccUni != null) {
          let sbjBeforePrd = sbj.elementsBeforeSelf(XmlTags.C_Wei).lastOrDefault();
          let sbjAfterPrd = sbj.elementsAfterSelf(XmlTags.C_Wei).firstOrDefault();
          let isAfterMatch = false;
          //后面无谓语 || 后面谓语之间有主语或谓语连词标记
          if (
            sbjAfterPrd == null ||
            xml
              .elements()
              .some(
                (p) =>
                  p.isAfter(sbj) &&
                  p.isBefore(sbjAfterPrd) &&
                  (p.tagName == XmlTags.C_Zhu ||
                    (p.tagName == XmlTags.C_CC &&
                      p.hasAttribute(XmlTags.A_Fun) &&
                      p.getAttribute(XmlTags.A_Fun) != XmlTags.V_Fun_UNI1))
              )
          )
            isAfterMatch = true;

          if (sbjBeforePrd != null && ccUni.isBefore(sbjBeforePrd) && isAfterMatch) {
            sbj.setAttribute(XmlTags.A_Inv, 1);
            if (moveElem) ccUni.addAfterSelf(sbj);
          }
        }
        //2.到句首之间有谓语
        else if (
          sbj.elementsBeforeSelf(XmlTags.C_Wei).length > 0 &&
          sbj.elementsBeforeSelf(XmlTags.C_Zhu).length == 0
        ) {
          let sbjBeforePrd = sbj.elementsBeforeSelf(XmlTags.C_Wei).lastOrDefault();

          // 主谓		主谓C谓		谓C主谓		谓C谓主
          // 谓			主谓			谓				主谓
          // 谓			谓				主谓			主谓
          //×║$×│﹛×│×﹜⣀⡀﹛×║$×﹜

          // 1、顶起复句或附加成分中复句 禁止倒装    2、主语到前面谓语间不能有带属性的连词成分
          let elems = xml.elements();
          if (
            (!sbj.parentNode.nameIs(XmlTags.C_Sent) && getXjSpans(xml).length > 1) ||
            elems
              .filter((p) => p.isAfter(sbjBeforePrd) && p.isBefore(sbj))
              .some(
                (p) =>
                  p.tagName == XmlTags.C_CC &&
                  p.hasAttribute(XmlTags.A_Fun) &&
                  (p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO ||
                    p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP)
              )
          )
            continue;

          // console.log(sbj);
          var beforeNpCC = sbj
            .elementsBeforeSelf(XmlTags.C_CC)
            .lastOrDefault(
              (p) =>
                p.hasAttributes() &&
                (p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO ||
                  p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP)
            );
          sbj.setAttribute(XmlTags.A_Inv, 1);
          if (moveElem) {
            if (beforeNpCC != null) beforeNpCC.addAfterSelf(sbj);
            else xml.addFirst(sbj);
          }
        }
      }

      //宾语倒装，分段调整
      let sections = [];
      let sect = [];
      let elems = xml.elements();
      // console.log(xml.cloneNode(true));

      // prd	obj	prd
      // obj	prd
      // prd	cc[fun]	obj	prd
      for (let i = 0; i < elems.length; i++) {
        const xelem = elems[i];
        // 1、多谓核连词    2、主语    3、谓语且sect已有谓语时（谓+合成cc+谓归到1个sect，合成cc+谓之间有其他成分则算2个sect）
        if (
          (xelem.nameIs(XmlTags.C_CC) && xelem.getAttribute(XmlTags.A_Fun) != XmlTags.V_Fun_SYN) ||
          xelem.nameIs(XmlTags.C_Zhu) ||
          (!xelem.nameIs(XmlTags.C_Wei) &&
            sect.some((o) => o.nameIs(XmlTags.C_Wei)) &&
            sect.last().nameIs(XmlTags.C_CC) &&
            sect.last().getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_SYN)
        ) {
          //&& xelem.Attribute(XmlTags.A_Fun).Value.EqualIgCase(XmlTags.V_Ext_UNI)
          sections.push(sect);
          sect = [];
        } else {
          sect.push(xelem);
        }
      }
      sections.push(sect);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        // console.log(section);
        let lastObjIdx = findLastIndex(section, (p) => p.tagName == XmlTags.C_Bin);
        if (lastObjIdx > -1 && section.some((p) => p.tagName == XmlTags.C_Wei && section.indexOf(p) > lastObjIdx)) {
          let lastObj = section[lastObjIdx];
          lastObj.setAttribute(XmlTags.A_Inv, 1);
          if (moveElem) {
            let insertPrd = section.find((p) => p.tagName == XmlTags.C_Wei && section.indexOf(p) > lastObjIdx);
            insertPrd.addAfterSelf(lastObj);
          }
        }
      }
    }
    child = tChild;
  }
}

/**
 * 调整在StackCompt中的GridCompt生成的XMl，合并UU后，使其能还原回独立的GridCompt
 * @param {Element} oriXml
 * @param {Element} uuXml
 * @returns
 */
function adjustStack2Grid(oriXml, uuXml) {
  let xml = oriXml.cloneNode(true);
  // 补充uu节点
  let xmlDoc = new Document();
  let uu = xml.element(XmlTags.C_UU);
  if (uu == null) {
    uu = uuXml != null ? uuXml : xmlDoc.createElement(XmlTags.C_UU);
    if (xml.tagName == XmlTags.C_Ding || xml.tagName == XmlTags.C_Zhuang) xml.append(uu);
    else if (xml.tagName == XmlTags.C_Bu) xml.addFirst(uu);
  }
  // console.log(xml.outerHTML)
  return xml;
}

/**
 * 针对节点子元素数组，获取可以判定构成小句的起止索引位置列表
 * @param {Element} node
 * @returns {Array} {s: , e: }
 */
function getXjSpans(node) {
  let spans = [];
  let children = node.elements();
  let afterPrd = false;
  let start = -1;
  let npcore = isNpCore(node);
  for (let i = 0; i < children.length; i++) {
    if (isPrdPeeredCompt(children[i], true)) {
      if (afterPrd) {
        if (children[i].nameIs(XmlTags.C_CC) && children[i].hasAttributes()) afterPrd = false;
        else if (
          children[i].nameIs(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Zhuang) ||
          (children[i].nameIs(XmlTags.C_CC) && !children[i].hasAttributes())
        ) {
          spans.push({
            s: start,
            e: i - 1,
          });
          start = i;
          afterPrd = children[i].nameIs(XmlTags.C_Wei);
        }
        // 独立语处理
        else if (children[i].nameIs(XmlTags.C_Ind)) {
          let j = i + 1;
          let next = children[j];
          while (next && next.nameIs(XmlTags.C_Ind)) {
            next = children[++j];
          }
          // 1、小句以独立语结尾
          if (next == null) {
            spans.push({
              s: start,
              e: j - 1,
            });
          }
          // 2、小句中间的独立语，归属于下一小句
          else if (
            next.nameIs(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Zhuang) ||
            (next.nameIs(XmlTags.C_CC) && !next.hasAttributes())
          ) {
            spans.push({
              s: start,
              e: i - 1,
            });
            start = i;
            afterPrd = false;
          }
        }
        // UV处理 成分复句中连续两个UV，前一个上一句，后一个归下一句
        else if (children[i].nameIs(XmlTags.C_UV) && children[i + 1] && children[i + 1].nameIs(XmlTags.C_UV)) {
          spans.push({
            s: start,
            e: i,
          });
          start = i + 1;
          afterPrd = false;
        }
      } else {
        if (start == -1 && !(npcore && children[i].nameIs(XmlTags.C_Ind))) start = i;
        if (children[i].nameIs(XmlTags.C_Wei)) afterPrd = true;
      }
    } else if (afterPrd) {
      let j = i - 1;
      if (npcore) while (children[j].nameIs(XmlTags.C_Ind)) j--;
      spans.push({
        s: start,
        e: j,
      });
      start = -1;
      afterPrd = false;
    }
  }
  if (afterPrd) {
    let j = children.length - 1;
    if (npcore) while (children[j].nameIs(XmlTags.C_Ind)) j--;

    spans.push({
      s: start,
      e: j,
    });
  }
  return spans;
}

//#region 判断元素节点性质
/**
 * 判断当前元素是否名词性成分
 * @param {Element} elem
 * @returns {Boolean}
 */
function isNpCore(elem) {
  return elem.nameIs(XmlTags.C_Zhu, XmlTags.C_Bin) || elem.elements().some((e) => hasNpTag(e));
}

/**
 * 是否包含NP标记
 * @param {Element} elem
 * @returns {Boolean}
 */
function hasNpTag(elem) {
  return (
    elem.nameIs(XmlTags.C_PP, XmlTags.C_FF, XmlTags.C_UN, XmlTags.C_Ding) ||
    (elem.nameIs(XmlTags.C_CC) &&
      elem.hasAttribute(XmlTags.A_Fun) &&
      (elem.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO || elem.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP))
  );
}

/**
 * 判断是否为主干成分
 * @param {Element} elem
 * @param {Boolean} includeCcUv 包含CC或UV
 * @returns {Boolean}
 */
function isMainCompt(elem, includeCcUv) {
  return (
    elem.nameIs(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin) ||
    (includeCcUv &&
      ((elem.nameIs(XmlTags.C_CC) &&
        ![XmlTags.V_Fun_COO, XmlTags.V_Fun_APP, XmlTags.V_Fun_COO1].contains(elem.getAttribute(XmlTags.A_Fun))) ||
        elem.nameIs(XmlTags.C_UV)))
  );
}

/**
 * 判断是否为顶起成分
 * @param {Element} elem
 * @returns
 */
function isComptInLifter(elem) {
  return (
    elem &&
    elem.parentElement &&
    !elem.parentElement.nameIs(XmlTags.C_Sent) &&
    isPrdPeeredCompt(elem) &&
    (elem.parentElement.nameIs(XmlTags.C_Wei) || isNpCore(elem.parentElement))
  );
}

/**
 * 判断当前元素是否为prd同级成分（可顶起）
 * @param {Element} elem
 * @param {Boolean} includeInd 是否包含独立语
 * @returns {Boolean}
 */
function isPrdPeeredCompt(elem, includeInd) {
  return (
    isMainCompt(elem, true) || elem.nameIs(XmlTags.C_Zhuang, XmlTags.C_Bu) || (includeInd && elem.nameIs(XmlTags.C_Ind))
  );
}
//#endregion

function createIndexFinder(dir) {
  return function (array, cb, context) {
    let length = array.length;
    // 控制初始 index，0 或者 length-1
    let index = dir >= 0 ? 0 : length - 1;

    // 条件： 在数组范围内；
    // 递增或递减：递加 1 或者 -1； 妙啊~
    for (; index >= 0 && index <= length - 1; index += dir) {
      if (cb.call(context, array[index], index)) return index;
    }
    return -1;
  };
}

const findLastIndex = createIndexFinder(-1);

import XmlTags from "./xml_tags";

export default {
  getXjSpans,
  adjustStack2Grid,
  xmlAdjust,
  isNpCore,
  hasNpTag,
  isComptInLifter,
  isPrdPeeredCompt,
};
