/**
 * 获取初始化图形对应的XML
 * @param {String} text 谓语PRD位置的文本
 * @returns
 */
function getInitialXml(text) {
  let xmlDoc = new Document();
  let xml = xmlDoc.createElement(XmlTags.C_FullSent);
  let xj = xmlDoc.createElement(XmlTags.C_Sent);
  let sbj = xmlDoc.createElement(XmlTags.C_Zhu);
  let x1 = xmlDoc.createElement(XmlTags.W_QueSheng);
  sbj.append(x1);
  let prd = xmlDoc.createElement(XmlTags.C_Wei);
  prd.setAttribute(XmlTags.A_Scp, "V");
  let x2 = xmlDoc.createElement(XmlTags.W_QueSheng);
  if (text != undefined) x2.innerHTML = text;
  prd.append(x2);
  xj.append(sbj, prd);
  xml.append(xj);
  return xml;
}

/**
 * 获取初始化xj对应的XML
 * @param {String} text 谓语PRD位置的文本
 * @returns
 */
function getInitialSentXml(text) {
  let xmlDoc = new Document();
  let xj = xmlDoc.createElement(XmlTags.C_Sent);
  let sbj = xmlDoc.createElement(XmlTags.C_Zhu);
  let x1 = xmlDoc.createElement(XmlTags.W_QueSheng);
  sbj.append(x1);
  let prd = xmlDoc.createElement(XmlTags.C_Wei);
  prd.setAttribute(XmlTags.A_Scp, "V");
  let x2 = xmlDoc.createElement(XmlTags.W_QueSheng);
  if (text != undefined) x2.innerHTML = text;
  prd.append(x2);
  xj.append(sbj, prd);
  return xj;
}

function getInitialComptXml(type, text) {
  let xmlDoc = new Document();
  let xml = xmlDoc.createElement(type);
  let x = xmlDoc.createElement(XmlTags.W_QueSheng);
  if (text != undefined) x.innerHTML = text;
  xml.append(x);
  return xml;
}

/**
 * 成分转用于复制的XML
 * @param {BaseCompt} compt
 * @param {Number} region 辖域 0-全部；1-左边；2-右边
 */
function generateXml4Copy(compt, region) {
  if (compt == null) return null;
  if (region == undefined) region = 0;

  let xml = compt.toXml();
  // console.log(xml.cloneNode(true));
  let xmlDoc = new Document();

  let iniType = compt.iniType == undefined ? "" : compt.iniType;
  let result = xmlDoc.createElement(XmlTags.O_Copy);
  if ([XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin].contains(iniType)) {
    let lefts = compt.leftRegionCompts();
    let rights = compt.rightRegionCompts();
    // console.log(123);
    if (lefts.length == 0 && rights.length == 0) {
      result.appendArray(xml.elements());
    } else {
      if (iniType == XmlTags.C_Wei) {
        result.append(xml);
      } else {
        result.appendArray(xml.elements());
      }

      if (region == 0 || region == 1) {
        lefts.reverse();
        for (let i = 0; i < lefts.length; i++) {
          const left = lefts[i];
          result.addFirst(left.toXml());
        }
      }

      if (region == 0 || region == 2) {
        // console.log(result.cloneNode(true));
        componentsAddToXml(compt, rights, result);
      }
    }
  } else {
    result.appendArray(xml.elements());
  }
  return result;
}

function componentsAddToXml(current, compts, elem) {
  let prevs = []; //前向成分
  //NP结构中是否首次经过核心词，经过后所有归属NP的成分都添加到向前NP核心里面
  let copyObj = elem.tagName == XmlTags.O_Copy && current.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin);
  let passNpCore = copyObj;
  let passObjSep = false; // 是否经过宾语分隔符
  // console.log(current.iniType);

  let items = compts;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let iType = item.iniType;
    let iTypeUp = iType == undefined ? "" : iType.toUpperCase();

    // C1 谓语分隔符 ->  cc
    if (item.belongType(PrdSep)) {
      passNpCore = false;
      passObjSep = false;
      if (iTypeUp != XmlTags.V_Fun_UNI) elem.appendChild(item.toXml());
      continue;
    }

    // C2 TextCompt
    if (item.belongType(TextCompt)) {
      let el = item.toXml();
      if (el == null) continue;

      let elName = el.tagName;
      //独立连词或UNI
      if (
        elName == XmlTags.C_CC &&
        (!el.hasAttribute(XmlTags.A_Fun) || el.getAttribute(XmlTags.A_Fun).equalIgnoreCase(XmlTags.V_Fun_UNI))
      ) {
        elem.appendChild(el);
        passNpCore = false;
        continue;
      }

      //PP UN CC FF
      if (iType == XmlTags.C_PP || iType == XmlTags.C_UN || elName == XmlTags.C_CC || iType == XmlTags.C_FF) {
        if (!passNpCore) prevs.push(el);
        else if (copyObj) elem.appendChild(el);
        else elem.lastChild.appendChild(el);
        continue;
      }

      if (el.tagName == XmlTags.O_Temp || iType == XmlTags.C_Zhu || iType == XmlTags.C_Bin) {
        // console.log(elem.cloneNode(true))
        if (prevs.length > 0) {
          // console.log(344)
          el.firstChild.addBeforeSelf(prevs);
          prevs.length = 0;
        }

        if (passNpCore) {
          // elem.lastChild.appendChild(el.firstChild)
          let elFirst = el.firstChild;
          while (elFirst != null) {
            elem.lastChild.appendChild(elFirst);
            elFirst = el.firstChild;
          }
        } else elem.appendChild(el);

        if (!passNpCore) passNpCore = true;
      } else {
        elem.appendChild(el);
      }
    }
    // C3 GridCompt、StackCompt （顶起、定状补、小句等）
    else if (item.belongType(GridCompt, StackCompt)) {
      let el = item.toXml();
      // console.log(elem.cloneNode(true))
      // console.log(item.toXml().cloneNode(true))
      // 3.1 定语
      if (iType == XmlTags.C_Ding) {
        if (passNpCore) elem.lastChild.appendChild(el);
        else prevs.push(el);
      }
      // 3.2 独立语
      else if (iType == XmlTags.C_Ind) {
        //扩展谓语标记
        let prdCC = items.find(
          (p) =>
            items.indexOf(p) > i &&
            (p.iniType == XmlTags.V_Fun_SER || p.iniType == XmlTags.V_Fun_PVT || p.iniType == XmlTags.V_Fun_UNI)
        );
        // 3.2.1 NP有前向成分 或 刚经过ObjSep
        if (prevs.length > 0 || (passObjSep && !passNpCore)) {
          prevs.push(el);
        }
        // 3.2.2  a 主语间或主语后主语分隔符前
        //        b 宾语间独立语归入宾语（b.1 后续无谓语且有宾语/ff/un   b.2 后续有谓语，且之间有宾语/ff/un）
        else if (
          passNpCore &&
          (elem.lastChild.tagName == XmlTags.C_Zhu ||
            items.some(
              (p) =>
                items.indexOf(p) > i &&
                (p.iniType == XmlTags.C_Bin || p.iniType == XmlTags.C_FF || p.iniType == XmlTags.C_UN) &&
                (prdCC == undefined || items.indexOf(p) < items.indexOf(prdCC))
            ))
        )
          elem.lastChild.appendChild(el);
        else elem.appendChild(el);
      }
      // 3.3 顶起主宾
      else if (iType == XmlTags.C_Zhu || iType == XmlTags.C_Bin) {
        if (prevs.length > 0) {
          if (el.firstChild) el.firstChild.addBeforeSelf(prevs);
          else el.appendArray(prevs);
          prevs.length = 0;
        }

        if (passNpCore) {
          let elems = el.elements();
          for (let j = 0; j < elems.length; j++) {
            const te = elems[j];
            elem.lastChild.appendChild(te);
          }
        } else {
          // 主、宾单独顶起一个谓语
          if (el.childElementCount == 1 && el.element(XmlTags.C_Wei)) el.firstChild.removeSelfTag();

          elem.appendChild(el);
        }
        passNpCore = true;
      }
      // 3.4 其他
      else elem.appendChild(el);
    }
    // C4 主宾分隔符
    else if (item.belongType(SbjSep, ObjSep)) {
      if (item.iniType == XmlTags.A_Inv) {
        elem.lastChild.setAttribute(XmlTags.A_Inv, 1);
      }
      passNpCore = false;
      if (item.belongType(ObjSep)) passObjSep = true;
    }
  }

  if (prevs.length > 0) {
    // console.log(elem.cloneNode(true));
    if (elem.firstChild != null) {
      elem.firstChild.addBeforeSelf(prevs);
    } else elem.addFirst(prevs);
    prevs.length = 0;
  }

  //att adv cmp ind中的NP结构，去除obj标记
  if (passNpCore && elem.element(XmlTags.C_Wei) == null && current.belongIniType(XmlTags.C_Sub)) {
    let innerObj = elem.element(XmlTags.C_Bin);
    if (innerObj != null) {
      innerObj.removeSelfTag();
    }
    let innerTemp = elem.element(XmlTags.O_Temp);
    if (innerTemp != null) {
      innerTemp.removeSelfTag();
    }
  }

  // console.log(elem.cloneNode(true));
}

/**
 * 转化为适用initialComptItems处理的XML数据
 * @param {Element} inXml
 * @param {XmlTags} type 成分类型
 * @param {Boolean} needWrap inXml子结点是否需要包裹一层type节点
 * @param {Boolean} isInMainLine 是否主句中的成分
 * @returns Element
 */
function convert2Parse(inXml, type, needWrap, isInMainLine) {
  // console.log(inXml.cloneNode(true));
  // console.log(type);

  let elems = inXml.elements();
  // 限制：NP无法往谓语复制 todo待完善
  if (type == XmlTags.C_Wei && elems.some((o) => XmlExtends.hasNpTag(o) || o.tagName == XmlTags.C_UU)) return null;

  // 限制：虚词位只接受单个词
  if (XmlTags.C_XX.contains(type) && elems.some((o) => o.tagName.length > 1)) return null;

  let isOnlySbj = inXml.elements().some((o) => o.tagName.length == 1);
  let xmlDoc = new Document();
  // 复制到定、状、补、独整体时，需要包裹一层type节点
  if (
    type == XmlTags.O_Temp ||
    (needWrap && [XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Bu, XmlTags.C_Ind].contains(type))
  ) {
    let newNode = xmlDoc.createElement(type);
    let child = inXml.firstChild;

    if (inXml.childElementCount == 1 && child.tagName == XmlTags.C_Wei) {
      child.removeSelfTag();
      child = inXml.firstChild;
    }

    // UU开头复制到Generic、定、状、独时，去掉UU
    if (
      child.tagName == XmlTags.C_UU &&
      [XmlTags.O_Temp, XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Ind].contains(type)
    ) {
      child.remove();
      child = inXml.firstChild;
    }

    while (child != null) {
      // 带连词独词句复制到其他成分时，需要CC转PP
      if (isOnlySbj && child.tagName == XmlTags.C_CC && !child.hasAttribute(XmlTags.A_Fun)) {
        if (child.firstElementChild) child.firstElementChild.replaceTagName(XmlTags.W_Jie);
        child = child.replaceTagName(XmlTags.C_PP);
      }

      // UU结尾复制到Generic、补、独时，去掉UU
      if (
        child.tagName == XmlTags.C_UU &&
        child.nextSibling == null &&
        [XmlTags.O_Temp, XmlTags.C_Bu, XmlTags.C_Ind].contains(type)
      ) {
        child.remove();
        break;
      }

      newNode.append(child);
      child = inXml.firstChild;
    }
    inXml.append(newNode);
  }
  // 主、宾位包含顶起
  else if (inXml.element(XmlTags.C_Wei) != null && (type == XmlTags.C_Zhu || type == XmlTags.C_Bin)) {
    let wrap = xmlDoc.createElement(type);
    wrap.appendArray(elems);
    inXml.append(wrap);
  }
  // 带UU的定、状、补复制到主、宾位
  else if (inXml.element(XmlTags.C_UU) != null && [XmlTags.C_Zhu, XmlTags.C_Bin].contains(type)) {
    let uu = inXml.element(XmlTags.C_UU);
    uu.remove();
  }

  // 替换最外层节点
  let rpNodes = [XmlTags.C_Zhu, XmlTags.C_Bin, XmlTags.O_Temp].concat(XmlTags.C_XX);
  if (rpNodes.contains(type)) {
    // 带连词独词句复制到其他成分时，需要CC转PP
    if (isOnlySbj) {
      let cc = inXml.element(XmlTags.C_CC);
      if (cc != null && !cc.hasAttribute(XmlTags.A_Fun)) {
        if (cc.firstElementChild) cc.firstElementChild.replaceTagName(XmlTags.W_Jie);
        cc.replaceTagName(XmlTags.C_PP);
      }
    }

    inXml = inXml.replaceTagName(type);
  } else if (type == XmlTags.C_Wei && elems.every((o) => o.tagName.length == 1)) {
    let wrap = xmlDoc.createElement(type);
    wrap.appendArray(elems);
    inXml.append(wrap);
  }

  // console.log(inXml.cloneNode(true));
  return inXml;
}

/**
 * 转化为带前后标签的，用于粘贴的XML数据（内部待完善，C#原逻辑，目前暂未使用）
 * @param {Element} inXml
 * @param {XmlTags} type 成分类型
 * @param {Number} isInMainLine 是否主句中的成分
 * @returns Element
 */
function convert2Paste(inXml, type, isInMainLine) {
  console.log(type);
  let limits = [XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin, XmlTags.O_Temp];
  let nTypes = [XmlTags.C_Zhu, XmlTags.C_Bin, XmlTags.O_Temp];
  let vTypes = [XmlTags.C_Wei, XmlTags.O_Temp];
  if (!limits.contains(type)) return inXml;

  let xml = inXml.cloneNode(true);
  // console.log(xml.cloneNode(true));
  let xmlDoc = new Document();
  let outXml = null;
  //主宾位包含顶起成分 且不带ATT PP FF UN
  if (
    (type == XmlTags.C_Zhu || type == XmlTags.C_Bin) &&
    ((xml.element(XmlTags.C_Wei) != null &&
      xml.element(XmlTags.C_Ding) == null &&
      xml.element(XmlTags.C_PP) == null &&
      xml.element(XmlTags.C_FF) == null &&
      xml.element(XmlTags.C_UN) == null) ||
      xml.elements().length == 1)
  ) {
    if (xml.element(XmlTags.C_Wei) != null) {
      //不带﹛﹜
      outXml = xmlDoc.createElement(XmlTags.O_Full);
      outXml.append(xml);
    } //带﹛﹜
    else {
      outXml = xmlDoc.createElement(XmlTags.O_Full);
      outXml.appendArray(xml.elements());
    }
  }
  //主宾位包含顶起成分 且带ATT/PP/FF/UN
  else if (
    (type == XmlTags.C_Zhu || type == XmlTags.C_Bin) &&
    xml.element(XmlTags.C_Wei) != null &&
    (xml.element(XmlTags.C_Ding) != null ||
      xml.element(XmlTags.C_PP) != null ||
      xml.element(XmlTags.C_FF) != null ||
      xml.element(XmlTags.C_UN) != null)
  ) {
    let pre = xmlDoc.createElement(XmlTags.O_Pre);
    let next = xmlDoc.createElement(XmlTags.O_Next);
    let removes = [];
    let passPrd = false;
    xml.elements().forEach((el) => {
      if (el.tagName == XmlTags.C_Ding || el.tagName == XmlTags.C_PP || (!passPrd && el.tagName == XmlTags.C_UN)) {
        pre.append(el);
        removes.push(el);
      } else if (el.tagName == XmlTags.C_FF || el.tagName == XmlTags.C_UN) {
        next.append(el);
        removes.push(el);
      } else if (el.tagName == XmlTags.C_Wei) passPrd = true;
    });
    // foreach (var el in removes)
    //     el.Remove();

    outXml = xmlDoc.createElement(xml.tagName);
    outXml.append(xml, pre, next);
  }
  //NP成分
  else if (xml.elements().some((o) => o.tagName.length == 1)) {
    let pre = xmlDoc.createElement(XmlTags.O_Pre);
    let next = xmlDoc.createElement(XmlTags.O_Next);
    let passNpCore = false; //NP核心词，判断前向、后向成分

    xml.elements().forEach((el) => {
      if (el.tagName.length == 1) {
        passNpCore = true;
        if (next.childElementCount > 0) {
          var lastNode = next.lastElementChild;
          var tag =
            el.parentElement.tagName == XmlTags.O_Temp && xml.element(XmlTags.C_Bin) == null
              ? XmlTags.C_Bin
              : el.parentElement.tagName;
          if (lastNode.tagName == tag) lastNode.append(el);
          else {
            next.append(xmlDoc.createElementNew(tag, el.outerHTML));
          }
        }
      } else if (
        (!passNpCore && (el.tagName == XmlTags.C_UN || el.tagName == XmlTags.C_Ding)) ||
        el.tagName == XmlTags.C_PP
      )
        pre.append(el);
      else if (
        el.tagName == XmlTags.C_Ding ||
        el.tagName == XmlTags.C_FF ||
        el.tagName == XmlTags.C_UN ||
        el.tagName == XmlTags.C_CC
      ) {
        next.append(el);
      }
    });

    outXml = xmlDoc.createElement(XmlTags.O_Full);
    outXml.append(xmlDoc.createElementNew(type, xml.innerHTML), pre, next);
  } else {
    let pre = xmlDoc.createElement(XmlTags.O_Pre);
    let next = xmlDoc.createElement(XmlTags.O_Next);
    let passPrd = false;

    xml.elements().forEach((el) => {
      if ((el.tagName == XmlTags.C_Zhuang && !passPrd) || el.tagName == XmlTags.C_Zhu) pre.append(el);
      else if (el.tagName == XmlTags.C_Zhuang || el.tagName == XmlTags.C_Bu) next.append(el);
      else if (el.tagName == XmlTags.C_Bin) {
        //todo带标点的处理
        el.elements().forEach((iel) => {});
      }
    });

    outXml = xmlDoc.createElementNew(XmlTags.O_Full, xml.innerHTML);
    outXml.append(pre, next);
  }

  return outXml;
}

/**
 * XML转成对应的前后项成分
 * @param {VueComponent} compt 当前焦点成分
 * @param {XmlTags} type 转化后所属类型
 * @param {Element} xml
 * @param {Boolean} autoTag 是否自动标注义项，默认为true
 * @param {Number} removeLeft 是否移除成分左边辖域内的成分，默认为1是
 * @param {Number} removeOnlyObj 是否仅移除成分右边辖域内宾语（默认移除所以右边辖域成分），默认为0否
 * @returns
 */
function parseXml2Compt(compt, type, xml, autoTag = true, removeLeft = 1, removeOnlyObj = 0) {
  if (compt == null || (compt.parentCompt == null && type != XmlTags.O_Sent) || xml == null) return;

  if (compt.belongIniType(XmlTags.O_Temp) && xml.element(XmlTags.O_Temp) != null) {
    compt = compt.parentCompt;
    xml.firstElementChild.replaceTagName(compt.iniType);
  }

  // console.log(xml.cloneNode(true));
  let pCompt = compt.parentCompt,
    col = compt.column,
    start = col,
    end = col;

  // 1. 复制到谓语
  if (type == XmlTags.C_Wei) {
    let prdExtend = compt.prdExtend();
    let leftPrd = compt.nearestLeftCompt(XmlTags.C_Wei);
    let leftElem = compt.nearestLeftElem();
    let beforeIsSyn = prdExtend == PrdExtend.NORMAL && leftPrd != null && leftPrd.prdExtend() == PrdExtend.SYN;
    let beforeIsSbjSep = leftElem != null && leftElem.belongType(SbjSep);
    // 限制：1. 合成（前边非主语分隔符）、连动、兼语谓语不能复制出主谓结构    2. 谓语前边是合成不能复制出主谓结构
    // 3. 合成谓语上限制出补语
    if (
      (xml.element(XmlTags.C_Zhu) != null &&
        (prdExtend == PrdExtend.SER ||
          prdExtend == PrdExtend.PVT ||
          (prdExtend == PrdExtend.SYN && !beforeIsSbjSep) ||
          beforeIsSyn)) ||
      (xml.element(XmlTags.C_Bu) != null && prdExtend == PrdExtend.SYN)
    )
      return 0;

    if (
      compt.isInMainLine &&
      compt.belongIniType(XmlTags.C_Wei) &&
      compt.prdExtend() != XmlTags.V_Fun_SYN &&
      type == XmlTags.C_Wei
    )
      appendEmptyObj(xml);

    // 谓语则考虑删除前后辖域内成分
    let fr = compt.leftRegion(0, 1, 0);
    let rr = compt.rightRegion(0, 0, 0);

    // 删除原有左边辖域成分
    if (removeLeft && fr > 0) {
      for (let i = col - 1; i >= col - fr; i--) {
        start = i;
        GridUtil.delColumn(pCompt, i);
      }
    }
    end = start;

    let hasObj = false;
    // 删除焦点位置
    GridUtil.delColumn(pCompt, start);

    let emptyObjCol = 0;
    let nrObj = compt.nearestRightCompt(XmlTags.C_Bin);
    // 后续辖域内空宾语的位置
    if (nrObj != null && nrObj.column <= col + rr) {
      hasObj = true;
      if (nrObj.toXml().textContent == "") emptyObjCol = nrObj.column - (col - start) - 1;
      else if (removeOnlyObj == 1) {
        let lastPrdEl = xml.elements().lastOrDefault((o) => o.tagName == XmlTags.C_Wei);
        if (lastPrdEl != null) {
          let lastObjEl = lastPrdEl.elementsAfterSelf(XmlTags.C_Bin).lastOrDefault();
          if (lastObjEl != null && lastObjEl.isEmptyX()) {
            lastObjEl.remove();
          }
        }
      }
    }

    // 如果是主谓谓语句，则移除后面所有成份
    if (xml.element(XmlTags.C_Wei) != null && xml.childElementCount == 1) {
      let first = xml.firstElementChild;
      if (first.element(XmlTags.C_Zhu) != null && first.element(XmlTags.C_Wei) != null) {
        removeOnlyObj = 0;
      }
    }

    // 删除原有右边辖域成分
    if (rr > 0) {
      for (let i = start + rr - 1; i >= start; i--) {
        if (removeOnlyObj == 0) {
          GridUtil.delColumn(pCompt, i);
        }
        //后续有空宾语，则移除
        else if (hasObj && emptyObjCol == i && emptyObjCol > 0) {
          GridUtil.delColumn(pCompt, i--);
          GridUtil.delColumn(pCompt, i--);
        }
      }
    }

    let skipSbjJudge = false;
    if (xml.element(XmlTags.C_Zhu) != null) {
      //前向是主语时移除原先主语竖线及成分
      let leftPrd = compt.nearestLeftCompt(XmlTags.C_Wei);
      let fr = leftPrd != null ? leftPrd.column : 0;
      let span = GridUtil.removeAssist(pCompt, SbjSep, fr, start);
      if (span > 0) {
        start = start - span;
        skipSbjJudge = true;
      }
    }

    // console.log(xml.cloneNode(true));
    let cType = getComponentType(xml);
    if (cType == StackCompt) {
      let newNode = wrapXjNode(xml);
      if (compt.isInMainLine) newNode.elements().forEach((o) => appendEmptyObj(o));

      let ppCompt = pCompt.parentCompt;
      // 1. grid转stack
      if (ppCompt == null) {
        let diagram = compt.ancestor("Diagram");
        diagram.type = StackCompt;
        diagram.$nextTick(() => {
          let row = 1;
          let rs = row;
          let xjs = xml.elements(XmlTags.C_Sent);
          let oldXml = xjs[0];
          for (let i = 0; i < xjs.length; i++) {
            const xj = i == 0 ? pCompt.toXml() : xjs[i];
            GridUtil.addRow(diagram.compt, row);
            GridUtil.addItem(GridCompt, diagram.compt, row, 1, XmlTags.O_Sent, xj);
            row++;
          }
          let re = row;
          activeStackChildren(diagram.compt, rs, re, autoTag, pCompt.sentId);

          // 事件订阅发布模式，等oldGrid加载完成触发事件
          diagram.$nextTick(() => {
            let oldGrid = diagram.compt.childrenItems.find((o) => o.row == 1);
            if (oldGrid != null) {
              oldGrid.$on("GridUpdated", () => {
                oldGrid.$off("GridUpdated");
                let oldCompt = oldGrid.childrenItems.find((o) => o.column == col && o.belongType(TextCompt));
                if (oldCompt != null) {
                  parseXml2Compt(oldCompt, XmlTags.C_Wei, oldXml);
                }
              });
            }
          });
        });

        return end;
      }
      // 2. stack中新增小句
      else {
        let row = pCompt.row + 1;
        let rs = row;
        let xjs = xml.elements(XmlTags.C_Sent);
        for (let i = 1; i < xjs.length; i++) {
          const xj = xjs[i];
          GridUtil.addRow(ppCompt, row);
          GridUtil.addItem(GridCompt, ppCompt, row, 1, XmlTags.O_Sent, xj);
          row++;
        }
        let re = row;
        activeStackChildren(ppCompt, rs, re, autoTag, pCompt.sentId);
      }
      xml = newNode.firstElementChild;
    }

    end = initialComptItems(pCompt, xml.firstElementChild, start, XmlTags.O_Temp, xml.tagName, skipSbjJudge) - 1;
  }
  // 2. 复制到小句
  else if (type == XmlTags.O_Sent) {
    wrapXjNode(xml);

    // 1. grid
    if (pCompt == null) {
      let diagram = compt.ancestor("Diagram");
      // 1.1 单个xj，xml替换
      if (xml.elements(XmlTags.C_Sent).length <= 1) {
        xml = xml.element(XmlTags.C_Sent) != null ? xml.element(XmlTags.C_Sent) : xml.replaceTagName(XmlTags.C_Sent);
        diagram.xml = xml;
        diagram.compt.items = [];
        diagram.$nextTick(() => {
          diagram.compt.fromXml();
        });
      }
      // 1.2 多个xj，grid转stack
      else {
        diagram.type = StackCompt;
        diagram.$nextTick(() => {
          let row = 1;
          start = row;
          let xjs = xml.elements(XmlTags.C_Sent);
          for (let i = 0; i < xjs.length; i++) {
            const xj = xjs[i];
            GridUtil.addRow(diagram.compt, row);
            GridUtil.addItem(GridCompt, diagram.compt, row, 1, XmlTags.O_Sent, xj);
            row++;
          }
          end = row;
          activeStackChildren(diagram.compt, start, end, autoTag, compt.sentId);
        });
      }
    }
    // 2. stack中新增小句
    else {
      let row = compt.row;
      start = row;
      GridUtil.delRow(pCompt, row);
      let xjs = xml.elements(XmlTags.C_Sent);
      if (xjs.length == 0) {
        // 复制独词句到小句
        xjs = [xml.replaceTagName(XmlTags.C_Sent)];
      }
      for (let i = 0; i < xjs.length; i++) {
        const xj = xjs[i];
        GridUtil.addRow(pCompt, row);
        GridUtil.addItem(GridCompt, pCompt, row, 1, XmlTags.O_Sent, xj);
        row++;
      }
      end = row;
      activeStackChildren(pCompt, start, end, autoTag, compt.sentId);
    }

    return end;
  }
  // 3. 复制到虚词位
  else if (XmlTags.C_XX.contains(type)) {
    compt.updateParentItem("xml", xml);
    compt.fromXml();
  }
  // 4. 复制到其他
  else {
    // todo 带xj包裹的复句复制到主宾时需要去掉xj
    GridUtil.delColumn(pCompt, start);
    end = initialComptItems(pCompt, xml.firstElementChild, start, XmlTags.O_Temp, xml.tagName, false) - 1;
  }

  // console.log("s" + start + ",e" + end);
  activeGridChildren(pCompt, start, end, autoTag);
  return end;
}

function activeStackChildren(compt, start, end, autoTag, sentId) {
  compt.$nextTick(() => {
    // console.log("s:" + start + "\te:" + end);
    compt.childrenItems
      .filter((o) => o.row >= start && o.row <= end)
      .forEach((ci) => {
        if (ci != null) {
          if (ci.belongType("BaseCompt")) ci.fromXml(autoTag);
          if (ci.belongType(GridCompt) && ci.sentId == 0 && sentId) ci.sentId = sentId;
          ci.active();
        }
      });
  });
}

function activeGridChildren(compt, start, end, autoTag) {
  compt.$nextTick(() => {
    compt.childrenItems
      .filter((o) => o.column >= start && o.column <= end)
      .forEach((ci) => {
        if (ci != null) {
          if (ci.belongType("BaseCompt")) ci.fromXml(autoTag);
          ci.active();
        }
      });
  });
}

/**
 * 经过添加pre和next处理后XML转成对应的前后项成分
 * @param {VueComponent} compt
 * @param {XmlTags} type
 * @param {Element} xml
 * @returns
 */
function pasteXml2Compt(compt, type, xml, removeLeft) {
  if (compt == null || compt.parentCompt == null || xml == null) return;
  if (removeLeft == undefined) removeLeft = 1;

  let pCompt = compt.parentCompt,
    core = xml.firstElementChild,
    pre = xml.element(XmlTags.O_Pre),
    next = xml.element(XmlTags.O_Next),
    start = 0,
    end = 0;

  if (type == XmlTags.C_Zhu || type == XmlTags.C_Wei || type == XmlTags.C_Bin) {
    let col = compt.column;
    let fr = compt.leftRegion(0, 1, 0);
    let hasUV =
      next != null && next.firstElementChild != null && next.firstElementChild.tagName == XmlTags.C_UV ? 1 : 0;
    let rr = compt.rightRegion(0, 1, hasUV);

    start = col;
    //删除原有左边辖域成分
    if (removeLeft && fr > 0) {
      for (let i = col - 1; i >= col - fr; i--) {
        start = i;
        GridUtil.delColumn(pCompt, i);
      }
    }
    end = start;

    //焦点位置
    let type = getComponentType(core);
    GridUtil.delColumn(pCompt, start);
    GridUtil.addColumn(pCompt, start);
    pCompt.items.push({
      xml: core,
      component: type,
      text: "",
      row: 1,
      column: start,
      iniType: core.tagName,
    });

    //删除原有右边辖域成分
    if (rr > 0) {
      for (let i = 1; i <= rr; i++) {
        GridUtil.delColumn(pCompt, start + 1);
      }
    }

    //右边成分
    let node = next.firstElementChild;
    col = start;
    while (node != null) {
      if (node.tagName == XmlTags.C_Bin) {
        GridUtil.addColumn(pCompt, ++col);
        pCompt.items.push({
          component: ObjSep,
          row: 1,
          column: col,
          iniType: node.hasAttribute(XmlTags.A_Inv) ? XmlTags.A_Inv : "",
        });
        end++;
      }

      let type = getComponentType(node);
      let row = getRow(node);
      GridUtil.addColumn(pCompt, ++col);
      pCompt.items.push({
        xml: node,
        component: type,
        text: "",
        row: row,
        column: col,
        iniType: node.tagName,
      });
      end++;
      node = node.nextElementSibling;
    }

    //左边成分，需要从后往前加
    node = pre.lastElementChild;
    col = start;
    while (node != null) {
      if (node.tagName == XmlTags.C_Zhu) {
        //前向是主语时移除原先主语竖线及成分
        let leftPrd = compt.nearestLeftCompt(XmlTags.C_Wei);
        let fr = leftPrd != null ? leftPrd.column : 0;
        let span = GridUtil.removeAssist(pCompt, SbjSep, fr, col);
        if (span > 0) {
          start = start - span;
          col = start;
        }

        GridUtil.addColumn(pCompt, col);
        pCompt.items.push({
          component: SbjSep,
          row: 1,
          column: col,
          iniType: node.hasAttribute(XmlTags.A_Inv) ? XmlTags.A_Inv : "",
        });
        end++;
      }

      let type = getComponentType(node);
      let row = getRow(node);
      GridUtil.addColumn(pCompt, col);
      pCompt.items.push({
        xml: node,
        component: type,
        text: "",
        row: row,
        column: col,
        iniType: node.tagName,
      });
      end++;

      node = node.previousElementSibling;
    }
  }

  pCompt.$nextTick(() => {
    for (let i = start; i <= end; i++) {
      const ci = pCompt.childrenItems.find((o) => o.column == i);
      if (ci != null && ci.belongType("BaseCompt")) {
        // console.log(i);
        ci.fromXml(); //todo 单个TextCompt词性义项会丢失
      }
    }
  });
  return;
}

//根据compt的xml数据，生成对应的compt.items
function initialItems(compt, autoTag) {
  // console.log('initialItems', compt);
  let xml = compt.xml;
  let childNodes = [];
  //图形初始化
  if (compt.belongType("Diagram") && XmlTags.C_FullSent == xml.tagName) {
    // console.log(xml.cloneNode(true));
    compt.type = getComponentType(xml);
    // console.log('compt.type', compt.type, compt.type == GridCompt);
    // 单句时，Diagram.compt.xml取xj节点
    if (compt.type == GridCompt) compt.xml = xml.element(XmlTags.C_Sent);
    // console.log(compt.xml);
    compt.compt.items.length = 0;
    compt.$nextTick(() => {
      compt.compt.fromXml(autoTag, true);
    });
    return;
  }
  //其他StackCompt和GridCompt初始化
  else {
    //主句为复句，针对其中单句调整结构、补充空宾语
    if (xml.tagName == XmlTags.C_Sent) {
      XmlExtends.xmlAdjust(xml);

      if (compt.isMainSent) {
        adjustSbjLift(xml);
        appendEmptyObj(xml);
      }
    }
    childNodes = xml.children;
    // console.log(xml.childNodes)
  }
  // console.log(xml.children);
  // console.log(compt.isMainSent)

  let col = xml.tagName == XmlTags.C_Bu ? 3 : 2;
  initialComptItems(compt, childNodes[0], col, XmlTags.O_Temp, xml.tagName);
}

/**
 *
 * @param {VueComponent} compt 待解析的成分
 * @param {Element} node 待解析的XML
 * @param {Number} col 开始位置
 * @param {String} mergeTag 词节点的TagName
 * @param {String} xmlTag 成分节点的TagName
 * @param {Boolean} skipSbjJudge 是否跳过主语分隔符判断（是-添加分隔符；否-判断辖域是否存在分隔符，不存在则添加）
 * @returns
 */
function initialComptItems(compt, node, col, mergeTag, xmlTag, skipSbjJudge) {
  // console.log(compt, node);
  let xmlDoc = new Document();
  let merge = xmlDoc.createElement(mergeTag);
  let hasUU = compt.cornerCompt != null ? true : false;
  let row = 1;
  let pNode = node.parentNode;
  let prev = null;

  // 判断是否需要添加主语分隔符
  let addedSbj = false; //是否已添加主语分隔符
  if (!skipSbjJudge) {
    let item = GridUtil.findElemByCol(compt, col, col);
    if (
      item != null &&
      // 还需考虑定语转主语情况
      item.belongIniType(XmlTags.C_Zhu, XmlTags.C_Ding) &&
      item.rightElems(XmlTags.C_Wei).some((o) => o.belongType(SbjSep))
    )
      addedSbj = true;
  }

  // console.log(compt.parentCompt)
  // console.log(node.cloneNode(true));

  while (node != null) {
    prev = node.previousElementSibling;
    let nodeNS = node.nextElementSibling;
    let nName = node.tagName;
    // if (node.nodeType != 1) {
    //   node = nodeNS
    //   continue;
    // }

    if (nName.length == 1) {
      merge.appendChild(node);
      node = nodeNS;
      continue;
    }

    let isStack = compt.belongType(StackCompt);
    if (!isStack) row = getRow(node);
    let type = getComponentType(node);

    if (merge.hasChildNodes()) {
      // console.log(prev)
      let iniType;
      //独词句   带后向虚词情况
      if (pNode.tagName == XmlTags.C_Sent) iniType = XmlTags.C_Zhu;
      //NP    前向成份为att/pp/un    任意前向，成份后向为uu    后向成份为ff/un/cc/pp/ind
      else if (
        pNode.tagName == XmlTags.C_Zhu ||
        pNode.tagName == XmlTags.C_Bin ||
        pNode.elements().some((o) => XmlExtends.hasNpTag(o))
      ) {
        iniType = pNode.tagName == XmlTags.C_Zhu ? XmlTags.C_Zhu : XmlTags.C_Bin;
      }
      //Generic
      else if (nName == XmlTags.C_UU || nName == XmlTags.C_CC || nName == XmlTags.C_Ind) iniType = XmlTags.O_Temp;
      else iniType = node.tagName;

      GridUtil.addColumn(compt, col);
      GridUtil.addItem(TextCompt, compt, 1, col++, iniType, merge.cloneNode(true));
      emptyNode(merge);
    }

    //补充顶起支架
    if (
      col == GlobalConst.DefaultStartCol &&
      nName != XmlTags.C_Ding &&
      nName != XmlTags.C_Zhu &&
      compt.belongType(GridCompt) &&
      !compt.isInStack &&
      compt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin)
    ) {
      compt.$nextTick(() => {
        GridUtil.checkLifter(compt);
      });
    }

    if (
      nName == XmlTags.C_Bin &&
      prev != null &&
      ((prev.tagName.length == 3 && prev.tagName != XmlTags.C_Ding) || prev.tagName == XmlTags.C_UV)
    ) {
      let iType = node.hasAttribute(XmlTags.A_Inv) ? XmlTags.A_Inv : "";
      GridUtil.addColumn(compt, col);
      GridUtil.addItem(ObjSep, compt, row, col++, iType);
    }

    //非顶起主语、宾语  或  联合主、宾语（如果其中有顶起，wrapLiftNode把顶起部分包裹相应节点）
    if (type == TextCompt && (nName == XmlTags.C_Zhu || nName == XmlTags.C_Bin)) {
      wrapLiftNode(node, nName);
      col = initialComptItems(compt, node.firstElementChild, col, node.tagName, node.tagName);

      // console.log(node.cloneNode(true));
      // 主语里不包含顶起的成分
      if (
        !addedSbj &&
        nName == XmlTags.C_Zhu &&
        getComponentType(node) == TextCompt &&
        nodeNS != null &&
        !XmlExtends.hasNpTag(nodeNS)
      ) {
        let iType = node.hasAttribute(XmlTags.A_Inv) ? XmlTags.A_Inv : "";
        GridUtil.addColumn(compt, col);
        GridUtil.addItem(SbjSep, compt, 1, col++, iType);
        addedSbj = true;
      }
    }
    //连词 介词 方位 UN UV
    else if (node.nameIs(XmlTags.C_CC, XmlTags.C_PP, XmlTags.C_FF, XmlTags.C_UN, XmlTags.C_UV)) {
      let column = col++;
      let flagType;
      let flagRow;
      if (
        node.tagName == XmlTags.C_CC &&
        node.hasAttribute(XmlTags.A_Fun) &&
        !XmlTags.Np_Fun.contains(node.getAttribute(XmlTags.A_Fun)) &&
        node.getAttribute(XmlTags.A_Fun) != XmlTags.V_Fun_UNI1
      ) {
        flagRow = 1;
        flagType = PrdSep;
        addedSbj = false;
      } else {
        flagRow = 3;
        flagType = WordFlag;
      }

      GridUtil.addColumn(compt, column);
      //先加文本后加标记，否则会有bug，如不会触发uni的WordUnit中innerText和text的watch事件
      if (
        node.tagName != XmlTags.C_CC ||
        !node.hasAttribute(XmlTags.A_Fun) ||
        XmlTags.CC_Text_Fun.contains(node.getAttribute(XmlTags.A_Fun))
      ) {
        let tRow;
        let tcType = node.hasAttribute(XmlTags.A_Fun) ? node.getAttribute(XmlTags.A_Fun) : node.tagName;

        // 定状间连词
        if (
          node.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO1 ||
          node.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_UNI1
        ) {
          tRow = 3;
        }
        // 其他虚词
        else {
          tRow = 1;
        }

        GridUtil.addItem(TextCompt, compt, tRow, column, tcType, node, "", null, TextType.VIRTUAL);
      }

      let iType = node.hasAttribute(XmlTags.A_Fun) ? node.getAttribute(XmlTags.A_Fun) : node.tagName;
      GridUtil.addItem(flagType, compt, flagRow, column, iType);
    }
    //定、状、补复句中UU
    else if (nName == XmlTags.C_UU && isStack) {
      compt.setCornerXml(node);
    }
    //其他
    else {
      let textType = TextType.SOLID;
      let column = col++;
      if (nName == XmlTags.C_UU) {
        textType = TextType.VIRTUAL_CORNER;
        hasUU = true;
        if (node.parentNode.tagName == XmlTags.C_Ding || node.parentNode.tagName == XmlTags.C_Zhuang) {
          column = GlobalConst.GridMaxCol;
        } else if (node.parentNode.tagName == XmlTags.C_Bu) {
          column = 1;
          col--;
        }
      }

      if (type == StackCompt) node = wrapXjNode(node);
      else if (XmlTags.C_Sub.contains(nName)) {
        // console.log(11)
        wrapLiftNode(node, XmlTags.C_Bin);
      }

      if (!isStack) GridUtil.addColumn(compt, column);

      if (nName == XmlTags.C_Sent) nName = compt.iniType;

      GridUtil.addItem(
        type,
        compt,
        !isStack ? row : row++,
        !isStack ? column : 1,
        nName.length == 1 ? XmlTags.O_Temp : nName,
        node,
        "",
        null,
        textType
      );
    }

    //补充顶起支架
    if (
      node.tagName == XmlTags.C_Zhu &&
      compt.belongType(GridCompt) &&
      !compt.isInStack &&
      compt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin)
    ) {
      compt.$nextTick(() => {
        GridUtil.checkLifter(compt);
      });
    }

    // 包含顶起结构的主语NP在最后位置补充主语分隔符
    let nNext = node.nextElementSibling;
    if (
      !addedSbj &&
      node.tagName == XmlTags.C_Zhu &&
      type != TextCompt &&
      ((pNode.tagName == XmlTags.C_Zhu && getComponentType(pNode) != TextCompt && nNext == null) ||
        (nNext != null &&
          [XmlTags.C_CC, XmlTags.C_Zhuang, XmlTags.C_UV, XmlTags.C_Ind, XmlTags.C_Wei].contains(nNext.tagName) &&
          !nNext.hasAttribute(XmlTags.A_Fun)))
    ) {
      // console.log(pNode.cloneNode(true));
      if (node.element(XmlTags.C_Wei) != null || node.element(XmlTags.C_Sent) != null) {
        let iType = node.hasAttribute(XmlTags.A_Inv) ? XmlTags.A_Inv : "";
        GridUtil.addColumn(compt, col);
        GridUtil.addItem(SbjSep, compt, 1, col++, iType);
        addedSbj = true;
      }
    }

    node = nodeNS;
  }

  //定、状、补添加空UU
  if (
    !hasUU &&
    compt.belongType(GridCompt) &&
    (xmlTag == XmlTags.C_Ding || xmlTag == XmlTags.C_Zhuang || xmlTag == XmlTags.C_Bu)
  ) {
    GridUtil.addItem(
      TextCompt,
      compt,
      1,
      xmlTag == XmlTags.C_Bu ? 1 : GlobalConst.GridMaxCol,
      XmlTags.C_UU,
      xmlDoc.createElement(XmlTags.C_UU),
      "",
      null,
      TextType.VIRTUAL_CORNER
    );
  }

  if (merge.hasChildNodes()) {
    // console.log(111)
    //独词句中，单词节点置为C_Zhu
    if (merge.tagName == XmlTags.O_Temp && (xmlTag == XmlTags.C_FullSent || xmlTag == XmlTags.C_Sent))
      xmlTag = XmlTags.C_Zhu;
    //定状补中，单词节点置为O_Temp
    else if (
      merge.tagName == XmlTags.O_Temp &&
      (xmlTag == XmlTags.O_Temp ||
        xmlTag == XmlTags.C_Ding ||
        xmlTag == XmlTags.C_Zhuang ||
        xmlTag == XmlTags.C_Bu ||
        xmlTag == XmlTags.C_Ind)
    ) {
      if (pNode.elements().some((o) => XmlExtends.hasNpTag(o))) xmlTag = XmlTags.C_Bin;
      else xmlTag = XmlTags.O_Temp;
    }

    GridUtil.addColumn(compt, col);
    GridUtil.addItem(TextCompt, compt, 1, col++, xmlTag, merge);
  }

  return col;
}

function getComponentType(elementNode) {
  if (elementNode.tagName == XmlTags.C_Sent) {
    return GridCompt;
  }

  let hasPrd = false;
  let hasNp = false;
  let sbjCount = 0;
  // console.log('getComponentType')
  // console.log(elementNode.cloneNode(true));
  let lastPrd;
  let lastSbj;
  // todo  附加成分中 复句判断
  for (let i = 0; i < elementNode.children.length; i++) {
    const child = elementNode.children[i];
    if (child.tagName == XmlTags.C_Wei) {
      hasPrd = true;

      if (lastPrd != null) {
        let cc = child
          .elementsBeforeSelf(XmlTags.C_CC)
          .lastOrDefault(
            (p) => p.hasAttribute(XmlTags.A_Fun) && XmlTags.Prd_Fun.contains(p.getAttribute(XmlTags.A_Fun))
          );
        // 两谓语间没有复杂谓语CC，则按复句处理
        if (cc == null || cc.isBefore(lastPrd)) sbjCount = 2;
      }

      lastPrd = child;
    } else if (XmlExtends.hasNpTag(child)) {
      hasNp = true;
    } else if (child.tagName == XmlTags.C_Zhu) {
      //非联合谓语中后一谓语的主语则sbjCount++
      let ccUni = child
        .elementsBeforeSelf(XmlTags.C_CC)
        .lastOrDefault((p) => p.hasAttribute(XmlTags.A_Fun) && p.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_UNI);
      if (ccUni == null) sbjCount++;
      else {
        let sbjBeforePrd = child.elementsBeforeSelf(XmlTags.C_Wei).lastOrDefault();
        if (sbjBeforePrd.isAfter(ccUni)) sbjCount++;
      }

      lastSbj = child;
    }
  }

  if ((elementNode.tagName == XmlTags.C_Zhu || elementNode.tagName == XmlTags.C_Bin) && hasPrd) {
    // 包含NP且顶起的主、宾设为TextCompt，方便附加NP成分的处理，顶起部分包裹节点后，递归处理
    if (hasNp) return TextCompt;
    else if (sbjCount > 1) return StackCompt;
    else return GridCompt;
  }

  // 附加成分
  if (XmlTags.C_Sub.contains(elementNode.tagName)) {
    //NP结构（包含顶起）  NP结构（不含顶起）  VP结构，主语个数<=1
    if ((hasNp && hasPrd) || !hasPrd || sbjCount <= 1) return GridCompt;
    else return StackCompt;
  }

  // 主谓谓语句
  if (elementNode.tagName == XmlTags.C_Wei && hasPrd) return sbjCount > 1 ? StackCompt : GridCompt;

  // NP结构暂时都返回TextCompt
  if (hasNp) {
    return TextCompt;
  }
  // 包含xj结点
  else {
    let xjs = elementNode.getElementsByTagName(XmlTags.C_Sent);
    if (xjs.length == 1) return GridCompt;
    else if (xjs.length > 1) return StackCompt;
  }

  if (sbjCount > 1) return StackCompt;

  // if (elementNode.tagName == XmlTags.C_CC) {
  //   if (!elementNode.hasAttribute(XmlTags.A_Fun) || elementNode.hasAttribute(XmlTags.A_Fun) &&
  //     (elementNode.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP || elementNode.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO)) {
  //     return TextCompt
  //   }
  //   return PrdSep
  // }
  return TextCompt;
}

/**
 * 调整由GridCompt生成的XMl，使其能在StackCompt中还原回对应的GridCompt
 * @param {Element} oriXml
 * @returns
 */
function adjustGridXml(oriXml) {
  let xml = oriXml.cloneNode(true);
  // 有助词需要移除，助词内容采用setCornerXml赋值
  let uu = xml.element(XmlTags.C_UU);
  if (uu != null) uu.remove();

  // 替换外标签为XmlTags.C_Sent
  let xmlDoc = new Document();
  if (xml.tagName != XmlTags.C_Sent) {
    let sent = xmlDoc.createElement(XmlTags.C_Sent);
    sent.appendArray(xml.elements());
    xml = sent;
  }
  // let first = xml.elements().firstOrDefault(o => o.tagName == XmlTags.C_Zhu || o.tagName == XmlTags.C_Wei);
  // // 补充缺少的句首主语  20220706 修改复句中主语逻辑后，无需补充
  // if (first != null && first.tagName == XmlTags.C_Wei) {
  //   let sbj = xmlDoc.createElement(XmlTags.C_Zhu);
  //   let x1 = xmlDoc.createElement(XmlTags.W_QueSheng);
  //   sbj.append(x1);
  //   first.addBeforeSelf(sbj);
  // }
  // console.log(xml.outerHTML)
  return xml;
}

//判断成份中包含几个xj，并添加对应的xj标签
function wrapXjNode(node) {
  if (node.tagName == XmlTags.C_Sent || node.element(XmlTags.C_Sent) != null) return node;

  let xmlDoc = new Document();
  let xjs = [];
  let children = node.elements();
  let uu = node.element(XmlTags.C_UU);
  // console.log('wrapXjNode')
  let spans = XmlExtends.getXjSpans(node); // {s:, e:}
  // console.log(node.cloneNode(true));
  // console.log(spans);
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    let nodes = children.slice(span.s, span.e + 1);
    let sent = xmlDoc.createElement(XmlTags.C_Sent);
    sent.append(...nodes);
    xjs.push(sent);
  }

  if (uu != null) {
    if (node.tagName == XmlTags.C_Bu) xjs.unshift(uu);
    else xjs.push(uu);
  }

  if (xjs.length != 0) {
    // 部分IE内核不支持replaceChildren方法，改用移除后添加的方式
    // node.replaceChildren(...xjs);

    node.removeAllChildren();
    node.appendArray(...xjs);
  }

  return node;
}

//定状补里为obj，且obj为顶起结构，则给对应结构包裹obj标签
function wrapLiftNode(node, wrapTag) {
  let hasPrd = false;
  let hasNp = false;
  let child = node.firstElementChild;

  //判断是否为包含NP顶起结构（有prd且有NP虚词位）
  while (child != null) {
    let cName = child.tagName;
    if (cName == XmlTags.C_Wei) hasPrd = true;
    else if (XmlExtends.hasNpTag(child)) hasNp = true;
    child = child.nextElementSibling;
  }

  if (!hasPrd || !hasNp) return;

  let xmlDoc = new Document();
  let wrap = xmlDoc.createElement(wrapTag);
  child = node.firstElementChild;
  // console.log('wrapLiftNode')
  while (child != null) {
    let next = child.nextElementSibling;
    if (
      (child.tagName.length == 3 && child.tagName != XmlTags.C_Ding) ||
      child.tagName == XmlTags.C_UV ||
      (child.tagName == XmlTags.C_CC &&
        (!child.hasAttribute(XmlTags.A_Fun) ||
          (child.getAttribute(XmlTags.A_Fun) != XmlTags.V_Fun_APP &&
            child.getAttribute(XmlTags.A_Fun) != XmlTags.V_Fun_COO)))
    ) {
      wrap.appendChild(child);
    } else if (wrap.hasChildNodes()) {
      child.addBeforeSelf(wrap.cloneNode(true));
      emptyNode(wrap);
    }
    child = next;
  }

  if (wrap.hasChildNodes()) {
    node.appendChild(wrap);
  }
}

/**
 * //补充空宾语
 * @param {Element} xj
 */
function appendEmptyObj(xj) {
  for (let i = 0; i < xj.children.length; i++) {
    // 根据谓语的前后成分来判断
    const xprd = xj.children[i];
    if (xprd.tagName != XmlTags.C_Wei) {
      continue;
    }

    let goNext = false;
    //主谓谓语判断
    for (let j = 0; j < xprd.children.length; j++) {
      const tc = xprd.children[j];
      if (tc.tagName == XmlTags.C_Zhu) {
        goNext = true;
        break;
      }
    }
    if (goNext) continue;

    //宾语提前句，不用加宾语
    let prev = xprd.previousElementSibling;
    if (prev != null && prev.tagName == XmlTags.C_Bin) continue;

    let next = xprd.nextElementSibling;
    let last = xprd;
    let skip = false; // 是否跳过添加宾语

    // 后续是否为多核谓语连词
    while (next != null && (next.tagName != XmlTags.C_CC || !next.hasAttribute(XmlTags.A_Fun))) {
      if (next.tagName == XmlTags.C_Bin) {
        skip = true;
        break;
      }
      last = next;
      next = next.nextElementSibling;
    }

    // 助动无需添加
    if (
      next != null &&
      next.tagName == XmlTags.C_CC &&
      next.hasAttribute(XmlTags.A_Fun) &&
      next.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_SYN
    )
      skip = true;

    if (!skip) {
      let xmlDoc = new Document();
      let obj = xmlDoc.createElement(XmlTags.C_Bin);
      let x = xmlDoc.createElement(XmlTags.W_QueSheng);
      obj.appendChild(x);
      while (last.tagName == XmlTags.C_UV || last.tagName == XmlTags.C_Ind) last = last.previousElementSibling;

      last.addAfterSelf(obj);
    }
  }
}

/**
 * 调整包含主语顶起的独词句结构
 * @param {Element} xml
 */
function adjustSbjLift(xml) {
  let elems = xml.elements();

  // 带谓语且带Np_Compt
  if (elems.some((o) => XmlTags.Np_Compt.contains(o.tagName)) && elems.some((o) => XmlTags.C_Wei == o.tagName)) {
    // document.createElement(XmlTags.C_Zhu); // 新建的节点tagName为大写，后续判断会有问题
    let sbj = document.createElementNS(null, XmlTags.C_Zhu);
    sbj.appendArray(elems);

    // 部分IE内核不支持replaceChildren方法，改用移除后添加的方式
    // xml.replaceChildren(sbj);

    xml.removeAllChildren();
    xml.appendChild(sbj);
  }
}

function getRow(node) {
  return node.tagName == XmlTags.C_Ding ||
    node.tagName == XmlTags.C_Zhuang ||
    node.tagName == XmlTags.C_Bu ||
    node.tagName == XmlTags.C_Ind
    ? 3
    : 1;
}

function emptyNode(node) {
  while (node.firstChild) {
    node.removeChild(node.lastChild);
  }
}

import TextType from "../enum/text_type";
import PrdExtend from "../enum/prd_extend.js";
import XmlTags from "./xml_tags.js";
import GlobalConst from "../enum/global_variable";
import GridUtil from "./grid_util";
import XmlExtends from "./xml_extends";

import BaseCompt from "../components/BaseCompt.vue";
import TextCompt from "../components/TextCompt.vue";
import GridCompt from "../components/GridCompt.vue";
import StackCompt from "../components/StackCompt.vue";

import FillLifter from "../components/assist/FillLifter.vue";
import SbjSep from "../components/assist/SbjSep.vue";
import PrdSep from "../components/assist/PrdSep.vue";
import ObjSep from "../components/assist/ObjSep.vue";
import WordFlag from "../components/assist/WordFlag.vue";

export default {
  convert2Parse,
  convert2Paste,
  parseXml2Compt,
  pasteXml2Compt,

  getComponentType,
  wrapXjNode,
  adjustGridXml,
  getInitialXml,
  getInitialSentXml,
  getInitialComptXml,
  generateXml4Copy,
  componentsAddToXml,
  initialItems,
  initialComptItems,
};
