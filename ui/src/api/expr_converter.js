import GlobalConst from '../enum/global_variable';
import XmlTags from './xml_tags';
import ExprTags from './expr_tags';
import XmlExtends from './xml_extends';

const XjExprSep = '\n\n';

// RexModSymbols
const modRe = new RegExp(GlobalConst.ModMarkRegex, 'g');
// RexSymbol
const synRe = new RegExp('[' + ExprTags.Syn_All + ']', 'g');
// RexSymbolAll
const synAllRe = new RegExp(
  '[' + ExprTags.Syn_All + ExprTags.Default + ']|/[a-z](?:d{3}[ABC]?)?',
  'g'
);
// RexSynmbolNoUU
const synNoUURe = new RegExp('[' + ExprTags.Syn_No_UU + ']', 'g');

// RexNonNestedModifier  匹配非嵌套括号
const nonNestedModifierRe = new RegExp(
  '[' +
    ExprTags.Syn_Additives_L +
    '][^' +
    ExprTags.Syn_Additives_L +
    ']+?[' +
    ExprTags.Syn_Additives_R +
    ']',
  'g'
);
//
const lBracketRe = new RegExp('[' + ExprTags.Syn_Brackets_L + ']');
// RexNeedSeg  判断是否需要进一步切分   保留首尾虚词结构：方、介、助
const needSegRe = new RegExp(
  '[' +
    ExprTags.Syn_SegMore +
    ']|(?<=[' +
    ExprTags.Syn_Additives_L +
    ExprTags.Syn_PP +
    ExprTags.Syn_FF +
    '].+?)[' +
    ExprTags.Syn_PP +
    ExprTags.Syn_UN_R +
    ExprTags.Syn_UV_R +
    '](?=.)|[' +
    ExprTags.Syn_FF +
    ExprTags.Syn_UN_L +
    ExprTags.Syn_UV_L +
    '](?=.+?[' +
    ExprTags.Syn_Additives_R +
    ExprTags.Syn_FF +
    ExprTags.Syn_PP +
    ExprTags.Syn_UN_L +
    ExprTags.Syn_UV_L +
    '])',
  'g'
);
// RexNpVir  NP结构虚词
const npVirRe = new RegExp('[' + ExprTags.Syn_NP_Vir + ']');

// RexTrimUU
const trimUURe = new RegExp(
  '^[^' +
    ExprTags.Syn_Additives_L +
    ']+' +
    ExprTags.Syn_UU_L +
    '|' +
    ExprTags.Syn_UU_R +
    '[^' +
    ExprTags.Syn_Additives_R +
    ']+$'
);

// RexReserveTopUU
const reserveTopUURe = new RegExp(
  ExprTags.Syn_UU_L +
    '(?=.+?[' +
    ExprTags.Syn_Additives_R +
    '])|(?<=[' +
    ExprTags.Syn_Additives_L +
    '].+?)' +
    ExprTags.Syn_UU_R
);

// RexTrimTopUU
const trimTopUURe = new RegExp(
  ExprTags.Syn_UU_L +
    '[^' +
    ExprTags.Syn_Additives_R +
    ']+$|^[^' +
    ExprTags.Syn_Additives_L +
    ']+' +
    ExprTags.Syn_UU_R
);

// RexSynmbolNoVir1  排除方、介、非角上助词
const synNoVir1Re = new RegExp('[' + ExprTags.Syn_No_Vir1 + ']', 'g');

/**
 * 将XML转化为句式表达式    注：需要和后端ToLinearExpr保持一致
 * @param {Element} xml 待转化的XML
 * @param {Number} withPosSen 词法信息，0：不带词性和义项，1：仅带词性，2：带词性和义项
 * @param {String} splitDynWord 需切分动态词的词类集，null：全不切，""：全切分，其它字符串：需切分的词类集合
 * @returns {String}
 */
const toLinearExpr = (xml, withPosSen = 0, splitDynWord = null) => {
  if (xml == null) return '';

  let expr = '';
  let len = xml.tagName.length;

  if (xml.nameIs(XmlTags.C_Para)) {
    return xml
      .elements()
      .map((p) => toLinearExpr(p, withPosSen, splitDynWord))
      .join(XjExprSep);
  }

  // C1 解析词逻辑
  if (len == 1) {
    if (
      xml.childElementCount > 0 &&
      splitDynWord != null &&
      (splitDynWord == '' || splitDynWord.includes(xml.tagName))
    ) {
      let mods = xml.getAttribute(XmlTags.A_Mod).match(modRe);
      // console.log(mods);
      let dynWordExpr = '[';
      let idx = 0;
      xml.elements().forEach((e) => {
        dynWordExpr += toLinearExpr(e, withPosSen, splitDynWord).trimEnd();
        if (!e.nameIs(XmlTags.W_BiaoDian) && idx < mods.length)
          dynWordExpr += mods[idx++];
      });

      dynWordExpr += ']';
      if (withPosSen > 0) dynWordExpr += xml.tagName;
      return dynWordExpr;
    }

    // 直接取词内容
    if (withPosSen == 0)
      return xml.textContent == ''
        ? ExprTags.Default
        : xml.textContent.replace(synAllRe, '?');

    // 带词性
    let word =
      xml.textContent == ''
        ? ExprTags.Default
        : xml.textContent.replace(synAllRe, '?');
    word += '/' + xml.tagName;

    // 带义项
    if (withPosSen == 2 && xml.hasAttribute(XmlTags.A_Sen))
      word += xml.getAttribute(XmlTags.A_Sen);

    return word;
  }

  // C2 解析小句xj或复句ju以及虚词逻辑
  if (len == 2) {
    // 2.1  ju -> xj
    if (xml.nameIs(XmlTags.C_FullSent)) {
      return xml
        .elements()
        .map((p) => toLinearExpr(p, withPosSen, splitDynWord))
        .join(XjExprSep);
    }
    // 2.2  xj -> sbj prd obj att adv cmp ind cc x
    else if (xml.nameIs(XmlTags.C_Sent)) {
      XmlExtends.xmlAdjust(xml, false);

      return xml
        .elements()
        .map((p) => toLinearExpr(p, withPosSen, splitDynWord))
        .join('');
    }

    // 2.3  cc pp un uu ff
    // 2.3.1  带词内容的虚词
    if (xml.childElementCount > 0) {
      expr = xml
        .elements()
        .map((p) => toLinearExpr(p, withPosSen, splitDynWord))
        .join('');
    }

    // 解析虚词符号    并列⣀⡀　同位≔≕　介∧　⠉连⠁　△▽▷助◁▲▼　□方     联合⠒⠂　连动／　兼语⫽　合成∶

    // 2.3.2  空pp un ff
    if (expr == '' && !xml.nameIs(XmlTags.C_CC)) {
      expr =
        withPosSen > 0
          ? ExprTags.Default + '/' + XmlTags.W_QueSheng + ' '
          : ExprTags.Default;
    }

    if (xml.nameIs(XmlTags.C_FF)) expr = ExprTags.Syn_FF + expr;
    else if (xml.nameIs(XmlTags.C_PP)) {
      let prevs = xml.elementsBeforeSelf();
      // 同一级，前面为空或为cc时，前出介词，   其余为后出介词
      if (prevs.length == 0 || prevs.lastOrDefault().nameIs(XmlTags.C_CC))
        expr += ExprTags.Syn_PP;
      else expr = ExprTags.Syn_PP_L + expr;
    } else if (xml.nameIs(XmlTags.C_CC)) {
      if (xml.hasAttribute(XmlTags.A_Fun)) {
        // 兼语⫽  连动／  合成∶  同位≔≕  联合⠒⠂  并列⣀⡀
        let fun = xml.getAttribute(XmlTags.A_Fun);
        if (fun == XmlTags.V_Fun_PVT) expr = ExprTags.Syn_CC_PVT;
        else if (fun == XmlTags.V_Fun_SER) expr = ExprTags.Syn_CC_SER;
        else if (fun == XmlTags.V_Fun_SYN) expr = ExprTags.Syn_CC_SYN;
        else if (fun == XmlTags.V_Fun_APP)
          expr = ExprTags.Syn_CC_App_L + expr + ExprTags.Syn_CC_App_R;
        else if (fun == XmlTags.V_Fun_COO)
          expr = ExprTags.Syn_CC_Coo_L + expr + ExprTags.Syn_CC_Coo_R;
        else if (fun == XmlTags.V_Fun_COO1)
          expr = ExprTags.Syn_CC_Coo1_L + expr + ExprTags.Syn_CC_Coo1_R;
        else if (fun == XmlTags.V_Fun_UNI1)
          expr = ExprTags.Syn_CC_Uni1_L + expr + ExprTags.Syn_CC_Uni1_R;
        else expr = ExprTags.Syn_CC_Uni_L + expr + ExprTags.Syn_CC_Uni_R;
      }
      // 句间连词  ⠉连⠁
      else expr = ExprTags.Syn_CC_L + expr + ExprTags.Syn_CC_R;
    }
    // ▷右助  左助◁
    else if (xml.nameIs(XmlTags.C_UU)) {
      if (xml.parentElement.nameIs(XmlTags.C_Bu))
        // 左助◁
        expr += ExprTags.Syn_UU_R;
      else expr = ExprTags.Syn_UU_L + expr;
    }
    // N前助▲     △N后助   主、宾出
    else if (xml.nameIs(XmlTags.C_UN)) {
      let nexts = xml.elementsAfterSelf(); // 同一层级 当前节点后面的所有节点
      // ▲ UN  通过后面成分来判断  1. 定语 2.单个词 3.顶起IsPrdPeeredCompt（主干成分 + adv + cmp）
      if (
        nexts.length > 0 &&
        (nexts.firstOrDefault().nameIs(XmlTags.C_Ding) ||
          nexts.firstOrDefault().tagName.length == 1 ||
          XmlExtends.isPrdPeeredCompt(nexts.firstOrDefault()))
      )
        expr += ExprTags.Syn_UN_R;
      //  △
      else expr = ExprTags.Syn_UN_L + expr;
    }
    //V前助▼  ▽V后助    谓语出
    else if (xml.nameIs(XmlTags.C_UV)) {
      let next = xml.nextElementSibling;
      let prev = xml.previousElementSibling;
      //▼ 后续节点是谓语或状语
      if (
        (!prev || !prev.nameIs(XmlTags.C_Wei)) &&
        next &&
        next.nameIs(XmlTags.C_Wei, XmlTags.C_Zhuang)
      )
        expr += ExprTags.Syn_UV_R;
      //▽
      else expr = ExprTags.Syn_UV_L + expr;
    }
  }
  // C3 句子成分
  else {
    // sbj -> n ff att  prd-> v / {sbj prd .. }
    expr = xml
      .elements()
      .map((p) => toLinearExpr(p, withPosSen, splitDynWord))
      .join('');

    // console.log(xml.cloneNode(true));
    // 判断成分符号逻辑
    // 〖独〗﹙定﹚主‖﹝状﹞谓﹤补﹥｜宾
    if (xml.nameIs(XmlTags.C_Zhu))
      expr = xml.hasAttribute(XmlTags.A_Inv)
        ? ExprTags.Syn_Sbj_L + expr
        : expr + ExprTags.Syn_Sbj;
    else if (xml.nameIs(XmlTags.C_Bin))
      expr = expr = xml.hasAttribute(XmlTags.A_Inv)
        ? expr + ExprTags.Syn_Obj_R
        : ExprTags.Syn_Obj + expr;
    else if (xml.nameIs(XmlTags.C_Ding))
      expr = ExprTags.Syn_Att_L + expr + ExprTags.Syn_Att_R;
    else if (xml.nameIs(XmlTags.C_Zhuang))
      expr = ExprTags.Syn_Adv_L + expr + ExprTags.Syn_Adv_R;
    else if (xml.nameIs(XmlTags.C_Bu))
      expr = ExprTags.Syn_Cmp_L + expr + ExprTags.Syn_Cmp_R;
    else if (xml.nameIs(XmlTags.C_Ind))
      expr = ExprTags.Syn_Ind_L + expr + ExprTags.Syn_Ind_R;
  }

  // C4 判断顶起括号逻辑 ﹛  ﹜
  if (XmlExtends.isComptInLifter(xml)) {
    // 取出elem 同一层级后面 既不等于ind也不等于UU的 节点
    let befores = xml
      .elementsBeforeSelf()
      .filter((p) => !(p.nameIs(XmlTags.C_Ind) || p.nameIs(XmlTags.C_UU)));
    // 取出elem 同一层级前面 既不等于ind也不等于UU的 节点
    let afters = xml
      .elementsAfterSelf()
      .filter((p) => !(p.nameIs(XmlTags.C_Ind) || p.nameIs(XmlTags.C_UU)));

    let bLast = befores.lastOrDefault();
    // 1.befores为空  2.bLast为att/pp/un  3.bLast为cc(fun= APP / COO)    顶起开始
    if (
      befores.length == 0 ||
      bLast.nameIs(XmlTags.C_Ding, XmlTags.C_PP, XmlTags.C_UN) ||
      (bLast.nameIs(XmlTags.C_CC) &&
        (bLast.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO ||
          bLast.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP))
    ) {
      expr = ExprTags.Syn_Lift_L + expr;
    }

    let aFirst = afters.firstOrDefault();
    // 1.afters为空  2.aFirst的开始为ff/un/pp  3.aFirst为cc(fun= APP / COO)    顶起结束
    if (
      afters.length == 0 ||
      aFirst.nameIs(XmlTags.C_FF, XmlTags.C_UN, XmlTags.C_PP) ||
      (aFirst.nameIs(XmlTags.C_CC) &&
        (aFirst.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO ||
          aFirst.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP))
    )
      expr += ExprTags.Syn_Lift_R;
  }

  // C5 判断顶起复句逻辑 §      ﹛×║×§×║×﹜║﹛×║﹝×﹞×│×﹜
  if (
    xml.nameIs(XmlTags.C_Wei, XmlTags.C_Bin, XmlTags.C_Bu, XmlTags.C_UV) &&
    !xml.hasAttribute(XmlTags.A_Inv)
  ) {
    let isUvStart = false;
    let before = xml.previousElementSibling;
    if (
      xml.nameIs(XmlTags.C_UV) &&
      (!before ||
        before.nameIs(
          XmlTags.C_Zhu,
          XmlTags.C_Zhuang,
          XmlTags.C_CC,
          XmlTags.C_UV
        ) ||
        before.hasAttribute(XmlTags.A_Inv))
    ) {
      isUvStart = true;
    }

    if (!isUvStart) {
      // elem同一层级后面的 首个元素（不等于ind && 不等于adv && 不等于cc && 不包含任何属性）
      let after = xml
        .elementsAfterSelf()
        .firstOrDefault(
          (p) =>
            !(
              p.nameIs(XmlTags.C_Zhuang) ||
              (p.nameIs(XmlTags.C_CC) && !p.hasAttributes())
            )
        );
      while (after && after.nameIs(XmlTags.C_Ind)) {
        after = after.nextElementSibling;
      }
      // console.log(after);
      // 符合上述条件的首个元素 不为空且是sbj或prd
      if (
        after &&
        ((after.nameIs(XmlTags.C_Zhu, XmlTags.C_Wei) &&
          !after.hasAttribute(XmlTags.A_Inv)) ||
          (xml.nameIs(XmlTags.C_UV) && after.nameIs(XmlTags.C_UV)))
      )
        expr += ExprTags.Syn_Lift_M;
    }
  }
  return expr;
};

/**
 * 句法准确率
 * @param {Element} input
 * @param {Element} standard
 * @returns
 */
const syntaxPrecision = (input, standard) => {
  if (input == null || standard == null) return 0.0;

  let sentence = standard.Value;
  if (string.IsNullOrEmpty(sentence)) return 0.0;

  let standardDct = getAllClauseExprs(standard);
  let inputDct = getAllClauseExprs(input);
  let precision = 0.0;

  return precision;
};

/**
 * 获取句式分层表达式
 * @param {Element} elem 等转化的XML
 * @param {Boolean} cutAttachment 是否剪去修饰成分
 * @param {Number} withPosSen 词法信息，0：不带词性和义项，1：仅带词性，2：带词性和义项
 * @param {String} splitDynWord 需切分动态词的词类集，null：全不切，""：全切分，其它字符串：需切分的词类集合
 * @param {Boolean} layerSeg 按新层次（修饰成分算同一层）切分
 * @returns
 */
const getAllClauseExprs = (
  elem,
  cutAttachment = true,
  withPosSen = 0,
  splitDynWord = null,
  layerSeg = true
) => {
  // console.log(elem.cloneNode(true));
  if (!elem.nameIs(XmlTags.C_Para, XmlTags.C_FullSent, XmlTags.C_Sent))
    return null;

  let dict = {};

  let elems = [];
  if (elem.nameIs(XmlTags.C_Sent)) elems = [elem];
  else if (elem.nameIs(XmlTags.C_Para)) {
    elem
      .elements()
      .forEach((o) => elems.splice(elems.length, 0, ...o.elements()));
  } else elems = elem.elements();

  let idx = 0;
  // console.log(elems);
  for (let i = 0; i < elems.length; i++) {
    const xj = elems[i];
    let fullExpr = toLinearExpr(xj, withPosSen, splitDynWord);
    // console.log(fullExpr);

    let layers = [];
    if (layerSeg) {
      let allSpans = getSegLayerSpans(fullExpr);
      // console.log(allSpans);
      for (let i = 0; i <= allSpans.length; i++) {
        let layer = toSegLayer(fullExpr, i, allSpans, cutAttachment);
        // console.log(layer);
        layers.push(layer);
      }
    } else {
      let allSpans = getAllSpans(fullExpr);
      // console.log(allSpans);
      for (let i = 0; i <= allSpans.length; i++) {
        let layer = toLayer(fullExpr, i, allSpans, cutAttachment);
        // console.log(layer);
        layers.push(layer);
      }
    }

    let l = xj.textContent.length;
    dict[i + '-' + idx + '-' + l] = layers;
    idx += l;
  }

  return dict;
};

/**
 * 获取表达式括号层次
 * @param {String} fullExpr 完整句式表达式
 * @returns
 */
function getAllSpans(fullExpr) {
  let allSpans = [];

  let virReM;
  // 不包含任何括号
  if (
    !fullExpr.match(lBracketRe) &&
    (fullExpr.match(needSegRe) ||
      ((virReM = fullExpr.match(npVirRe)) != null && virReM.length == 1))
  ) {
    return allSpans;
  }

  let lefts = []; //左括号，起始位置
  for (let i = 0; i < fullExpr.length; i++) {
    const f = fullExpr[i];

    if (ExprTags.Syn_Brackets_L.includes(f)) {
      lefts.push({ item1: f, item2: i });

      if (lefts.length > allSpans.length) {
        allSpans.push([]);
      }
    } else if (ExprTags.Syn_Brackets_R.includes(f)) {
      if (lefts.length == 0) {
        console.error(f + '：缺配对左括号！');
      }
      let left = lefts.pop();
      if (ExprTags.Syn_Pair[left.item1] != f) {
        console.error(f + '括号配对错误');
      }

      let curlayer = lefts.length + 1;
      let spans = allSpans[curlayer - 1];
      spans.push({ item1: left.item1, item2: left.item2, item3: i });
    }
    // console.log(f);
  }

  if (lefts.length > 0) {
    console.error(lefts.lastOrDefault() + '：缺配对右括号！');
  }

  return allSpans;
}

/**
 *
 * @param {String} fullExpr 完整句式表达式
 * @param {Number} depth 指定最大的层次深度
 * @param {*} allSpans
 * @param {Boolean} cutAttachment 超过层数的内容是否截除
 * @param {Number} baseLayer 设置基干层的深度，默认即主干层(0)
 * @param {Number} baseLayerSpan 基干取自第baseLayer层的第几个span，仅当baseLayer>0时有效
 * @returns
 */
function toLayer(
  fullExpr,
  depth,
  allSpans,
  cutAttachment = true,
  baseLayer = 0,
  baseLayerSpan = 0
) {
  if (depth < 0) return null;

  if (baseLayer + depth >= allSpans.length) {
    if (baseLayer == 0) return fullExpr;
    else {
      if (baseLayerSpan >= allSpans[baseLayer - 1].length) {
        console.error(
          '基干层Span序号有误！最大为：' + (allSpans[baseLayer - 1].length - 1)
        );
      }

      let span = allSpans[baseLayer - 1][baseLayerSpan];
      return fullExpr
        .substring(span.item2 + 1, span.item3)
        .replace(trimUURe, '');
    }
  }

  let expr = '';
  let cutspans = allSpans[baseLayer + depth];
  // console.log(cutspans);
  let start =
    baseLayer == 0 ? 0 : allSpans[baseLayer - 1][baseLayerSpan].item2 + 1;
  let end =
    baseLayer == 0
      ? fullExpr.length
      : allSpans[baseLayer - 1][baseLayerSpan].item3;
  let j = 0;
  while (j < cutspans.length && cutspans[j].item2 < start) j++;
  expr += fullExpr.substring(
    start,
    j < cutspans.length && cutspans[j].item2 < end ? cutspans[j].item2 : end
  );

  // console.log(cutspans);
  for (let i = j; i < cutspans.length; i++) {
    let span = cutspans[i];
    if (span.item2 > end) break;

    if (!cutAttachment) {
      expr += fullExpr.substring(span.item2 + 1, span.item3).replace(synRe, '');
    } else if (span.item1 == ExprTags.Syn_Lift_L) {
      let liftup = fullExpr.substring(span.item2 + 1, span.item3);
      let pruned = liftup.replace(nonNestedModifierRe, '');
      while (pruned != liftup) {
        liftup = pruned;
        pruned = liftup.replace(nonNestedModifierRe, '');
      }
      expr += liftup.replace(synRe, '');
    }

    let nxtStart =
      i < cutspans.length - 1 && cutspans[i + 1].item2 < end
        ? cutspans[i + 1].item2
        : end;
    expr += fullExpr.substring(span.item3 + 1, nxtStart);
    // console.log(expr);
  }
  return expr.replace(trimUURe, '');
}

/**
 * 获取表达式括号层次
 * @param {String} fullExpr 完整句式表达式
 * @returns
 */
function getSegLayerSpans(fullExpr) {
  let segLayerSpans = [];
  let virReM;
  // 不包含任何括号
  if (
    !fullExpr.match(lBracketRe) &&
    (fullExpr.match(needSegRe) ||
      ((virReM = fullExpr.match(npVirRe)) != null && virReM.length == 1))
  ) {
    segLayerSpans.push([
      { item1: '', item2: 0, item3: fullExpr.length - 1, item4: 0 },
    ]);
    return segLayerSpans;
  }

  let allSpans = getAllSpans(fullExpr);

  let moreSeg = null;
  for (let i = 0; i < allSpans.length; i++) {
    let spans = allSpans[i];
    let segSpans = [];
    for (let j = 0; j < spans.length; j++) {
      const sp = spans[j];
      let rangeStr = fullExpr.substring(sp.item2 + 1, sp.item3);
      // console.log(rangeStr);
      let needSeg =
        rangeStr.match(needSegRe) ||
        (rangeStr.match(trimTopUURe) && rangeStr.match(synNoUURe))
          ? 1
          : 0;
      segSpans.push({
        item1: sp.item1,
        item2: sp.item2,
        item3: sp.item3,
        item4: needSeg,
      });
      //不包含括号，需要切分，并且是最后一层，则再扩展一层
      if (
        !rangeStr.match(nonNestedModifierRe) &&
        needSeg == 1 &&
        i + 1 == allSpans.length
      ) {
        moreSeg = [
          { item1: sp.item1, item2: sp.item2, item3: sp.item3, item4: 0 },
        ];
      }
    }
    segLayerSpans.push(segSpans);
  }
  if (moreSeg != null) {
    segLayerSpans.push(moreSeg);
  }

  return segLayerSpans;
}

/**
 * 移除句式表达式符号处理
 * @param {String} fullExpr
 * @param {Number} start fullExpr开始索引
 * @param {Number} end fullExpr结束索引
 * @param {Boolean} withStart 保留开始
 * @param {Boolean} withEnd 保留结束
 */
function replaceInner(fullExpr, start, end, withStart = true, withEnd = true) {
  let strStart;
  if (withStart)
    if (
      ExprTags.Syn_Brackets_L.includes(fullExpr[start]) ||
      ExprTags.Syn_Brackets_R.includes(fullExpr[start])
    )
      //保留相应的括号
      strStart = fullExpr[start];
    //形如﹥│﹙需要去掉│
    else strStart = fullExpr[start].replace(synRe, '');
  else strStart = '';

  if (end < start + 1) {
    return strStart;
  }

  let inner = fullExpr.substring(start + 1, end);

  //保留角上助词
  if (inner.match(trimTopUURe))
    inner = inner.replace(reserveTopUURe, '').replace(synNoUURe, '');
  //保留首尾虚词结构：方、介、助
  else inner = inner.replace(needSegRe, '').replace(synNoVir1Re, '');

  return strStart + inner + (withEnd ? fullExpr[end] : '');
}

/**
 *
 * @param {String} fullExpr
 * @param {Number} depth
 * @param {Boolean} cutAttachment
 * @returns
 */
function toSegLayer(fullExpr, depth, segLayerSpans, cutAttachment = true) {
  if (depth < 0) return '';

  if (depth == 0) {
    if (cutAttachment) return '';

    return fullExpr
      .replace(synRe, '')
      .replace(
        new RegExp(ExprTags.Default + '(/' + XmlTags.W_QueSheng + ')?', 'g'),
        ''
      );
  }

  if (depth > segLayerSpans.length) return fullExpr;

  let expr = '';
  let cutspans = segLayerSpans[depth - 1];
  // console.log(cutspans);

  let start = 0;
  let end = fullExpr.length;
  let j = 0;
  while (j < cutspans.length && cutspans[j].item2 < start) j++;

  expr += fullExpr.substring(
    start,
    j < cutspans.length && cutspans[j].item2 < end ? cutspans[j].item2 : end
  );
  // console.log(expr);

  for (let i = j; i < cutspans.length; i++) {
    let span = cutspans[i];
    if (span.item2 > end) break;

    if (depth == segLayerSpans.length) {
      //最后一层
      expr += fullExpr.substring(span.item2, span.item3 + 1);
    } else if (!cutAttachment) {
      //保留首尾括号以及同层次的UU
      expr += replaceInner(fullExpr, span.item2, span.item3);
    } else if (span.item1 == ExprTags.Syn_Lift_L) {
      let liftup = fullExpr.substring(span.item2 + 1, span.item3);
      let pruned = liftup.replace(nonNestedModifierRe, '');
      while (pruned != liftup) {
        liftup = pruned;
        pruned = liftup.replace(nonNestedModifierRe, '');
      }
      expr +=
        fullExpr[span.item2] + liftup.replace(synRe, '') + fullExpr[span.item3];
    } else if (cutAttachment && depth < segLayerSpans.length) {
      //先判断当前span是否与下一层有交叉
      let cs = segLayerSpans[depth].filter(
        (p) => p.item2 > span.item2 && p.item3 < span.item3
      );
      if (cs.length == 0) {
        expr += replaceInner(fullExpr, span.item2, span.item3);
      } else {
        let csStart = span.item2;
        //剪枝时，找到更下一层
        for (let k = 0; k < cs.length; k++) {
          //如果是顶起，需要剪枝再下一层
          if (cs[k].item1 == ExprTags.Syn_Lift_L[0]) {
            //span.Item2到cs[k].Item1之间部分
            expr += replaceInner(
              fullExpr,
              csStart,
              cs[k].item2,
              csStart == span.item2,
              false
            );

            //再下一层存在
            if (depth + 1 < segLayerSpans.length) {
              let liftInnerSpans = segLayerSpans[depth + 1].filter(
                (p) => p.item2 > cs[k].item2 && p.item3 < cs[k].item3
              );

              if (liftInnerSpans.length == 0) {
                expr += replaceInner(
                  fullExpr,
                  cs[k].item2 + 1,
                  cs[k].item3 - 1
                );
              } else {
                let liftStart = cs[k].item2;
                //对再下一层进行剪枝
                for (let m = 0; m < liftInnerSpans.length; m++) {
                  if (
                    liftInnerSpans[m].item2 > cs[k].item2 &&
                    liftInnerSpans[m].item3 < cs[k].item3
                  ) {
                    expr += replaceInner(
                      fullExpr,
                      liftStart,
                      liftInnerSpans[m].item2,
                      false,
                      false
                    );
                    liftStart =
                      m < liftInnerSpans.length - 1 &&
                      liftInnerSpans[m + 1].item2 < cs[k].item3
                        ? liftInnerSpans[m + 1].item2
                        : cs[k].item3;
                    if (liftStart > liftInnerSpans[m].item3 + 1) {
                      expr += replaceInner(
                        fullExpr,
                        liftInnerSpans[m].item3 + 1,
                        liftStart,
                        true,
                        liftStart == cs[k].item3
                      );
                    }
                  }
                }
              }
            } else expr += replaceInner(fullExpr, cs[k].item2, cs[k].item3);

            //cs[k].item3到 span.item3之间部分
            expr += replaceInner(fullExpr, cs[k].item3, span.item3, false);
          } else if (cs[k].item2 > span.item2 && cs[k].item3 < span.item3) {
            expr += replaceInner(
              fullExpr,
              csStart,
              cs[k].item2,
              csStart == span.item2,
              false
            );
            csStart =
              k < cs.length - 1 && cs[k + 1].item2 < span.item3
                ? cs[k + 1].item2
                : span.item3;
            if (csStart >= cs[k].item3 + 1) {
              expr += replaceInner(
                fullExpr,
                cs[k].item3 + 1,
                csStart,
                true,
                csStart == span.item3
              );
            }
          }
        }
      }
    }

    let nxtStart =
      i < cutspans.length - 1 && cutspans[i + 1].item2 < end
        ? cutspans[i + 1].item2
        : end;
    if (nxtStart > span.item3 + 1) {
      expr += fullExpr.substring(span.item3 + 1, nxtStart);
    }
  }
  return expr;
}

export default { XjExprSep, toLinearExpr, getAllClauseExprs };
