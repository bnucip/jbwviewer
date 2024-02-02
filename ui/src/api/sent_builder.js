// 定义一个策略对象
let builderStrategy = (function () {
  // 内部算法对象
  let strategy = {
    addSbj(refCompt, moveText, type, event) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：谓语或Generic
      if (
        refCompt.iniType != XmlTags.C_Wei &&
        refCompt.iniType != XmlTags.O_Temp
      )
        return false;

      let col = refCompt.column;
      let pCompt = refCompt.parentCompt;

      let sIdx = 0;
      // 左边最后一个联合谓语分隔符
      let prdSeps = GridUtil.findElemsByCol(pCompt, sIdx, col, PrdSep).filter(
        (o) => o.prdType == XmlTags.V_Fun_UNI
      );
      if (prdSeps.length > 0) sIdx = prdSeps.lastOrDefault().column;
      // console.log(sIdx);

      let eIdx = GlobalConst.GridMaxCol;
      // 右边第一个联合谓语分隔符
      let rightPrdSeps = GridUtil.findElemsByCol(
        pCompt,
        col,
        eIdx,
        PrdSep
      ).filter((o) => o.prdType == XmlTags.V_Fun_UNI);
      if (rightPrdSeps.length > 0) eIdx = rightPrdSeps.firstOrDefault().column;
      // console.log(eIdx);

      let hasLeftPrd =
        GridUtil.findElemsByCol(
          pCompt,
          sIdx,
          Math.min(col - 1, eIdx),
          BaseCompt
        ).firstOrDefault((o) => o.belongIniType(XmlTags.C_Wei)) != null;
      // console.log(hasLeftPrd)
      // 约束：[sIdx, eIdx]范围内有左向谓语（即当前谓语是连动/兼语/合成）
      if (hasLeftPrd) return false;

      let removeSbj = false;
      let lastSbj = GridUtil.findElemsByCol(
        pCompt,
        sIdx,
        eIdx,
        BaseCompt
      ).lastOrDefault((o) => o.belongIniType(XmlTags.C_Zhu));
      // console.log(lastSbj)
      // [sIdx, eIdx]范围内有主语
      if (lastSbj != null) {
        let uniPos = GridUtil.posInUni(lastSbj);
        let isTc = lastSbj.belongType(TextCompt);
        //空TextCompt主语，后续异常，其他情况则直接返回
        if (isTc && uniPos == UniPos.ONLY && lastSbj.text.trim() == '')
          removeSbj = true;
        else {
          let rt = refCompt.textExtract(TextRegion.FRONT, true);
          // 向主语范围内最后一个文本合并
          let rightLast = lastSbj.rightRegionCompts().lastOrDefault();
          if (rightLast != null) rightLast.textFill(rt, TextRegion.BEHIND);
          else lastSbj.textFill(rt, TextRegion.BEHIND);
          return true;
        }
      }

      // 分段内部肯定无主语
      let idx = col - refCompt.leftRegion(1, 1, 0);
      let oldIdx = idx;
      if (removeSbj) {
        idx -= GridUtil.removeAssist(pCompt, SbjSep, sIdx, eIdx);
      }
      // 按住Shift向最开始切，不按则把谓语前的状语、连词等向前推
      if (event == null || !event.shiftKey) {
        let leftCompts = GridUtil.findElemsByCol(
          pCompt,
          oldIdx,
          col,
          BaseCompt
        );
        for (let i = 0; i < leftCompts.length; i++) {
          const lc = leftCompts[i];
          if (
            lc.belongIniType(
              XmlTags.C_Zhuang,
              XmlTags.C_CC,
              XmlTags.C_UV,
              XmlTags.C_Ind,
              XmlTags.C_Ding,
              XmlTags.C_FF
            )
          )
            idx++;
          else break;
        }
      }
      // console.log(idx)

      if (refCompt.iniType == XmlTags.O_Temp)
        refCompt.updateParentItem('iniType', XmlTags.C_Wei);

      GridUtil.addColumn(pCompt, idx);
      GridUtil.addItem(SbjSep, pCompt, 1, idx);
      GridUtil.addColumn(pCompt, idx);
      GridUtil.addItem(TextCompt, pCompt, 1, idx, XmlTags.C_Zhu);

      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == idx && o.belongType(TextCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          if (moveText) {
            let text = refCompt.textExtract(TextRegion.FRONT, true).trim();
            newCompt.textFill(text, TextRegion.FRONT);
          }
        }
        let next = newCompt.nearestRightElem();
        if (next != null) next.active();
        if (pCompt.belongType(GridCompt) && !refCompt.isInMainLine)
          GridUtil.checkLifter(pCompt);
      });

      return true;
    },

    addPrdLift(refCompt) {
      // console.log(refCompt);
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：主语/谓语/宾语
      if (
        refCompt.iniType != XmlTags.C_Zhu &&
        refCompt.iniType != XmlTags.C_Wei &&
        refCompt.iniType != XmlTags.C_Bin
      )
        return false;

      // 约束：谓语位置顶起时，前面需要有主语
      let leftSbj = refCompt.nearestLeftCompt(XmlTags.C_Zhu);
      if (refCompt.iniType == XmlTags.C_Wei && leftSbj == null) return;

      let col = refCompt.column;
      let pCompt = refCompt.parentCompt;

      let liftNps = [XmlTags.C_Ding, XmlTags.C_FF, XmlTags.C_PP, XmlTags.C_UN];
      // 独词句（主语是最后一个成分或不包含支持顶起的成分）切出谓语；其他独词情况可顶起
      if (
        refCompt.isOnlySbj &&
        (refCompt.nearestRightCompt() == null ||
          pCompt.childrenItems.every((o) => !o.belongIniType(liftNps)))
      ) {
        let newCol =
          pCompt.childrenItems.filter((o) => o.belongType(BaseCompt)).length +
          GlobalConst.DefaultStartCol;
        let text = refCompt
          .textExtract(TextRegion.BEHIND, true)
          .trim()
          .insertPuncSpace();
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(TextCompt, pCompt, 1, newCol, XmlTags.C_Bin);
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(ObjSep, pCompt, 1, newCol);
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          newCol,
          XmlTags.C_Wei,
          null,
          text
        );
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(SbjSep, pCompt, 1, newCol);
        pCompt.$nextTick(() => {
          pCompt.active();
        });
      }
      // 其他情况，顶起谓语
      else {
        let iniItems = [];
        let text = refCompt.textExtract(TextRegion.ALL, true).trim();
        GridUtil.delColumn(pCompt, col);
        // 主谓谓语句
        if (refCompt.iniType == XmlTags.C_Wei) {
          let rr = refCompt.rightRegion();
          // todo 完善逻辑   顶起主谓谓语后会出现非法结构（谓语后接并列宾语等）
          GridUtil.removeAssist(pCompt, ObjSep, col, col + rr);
          iniItems = GridUtil.iniSLVItems(text);
        }
        // 顶起单个谓语
        else {
          iniItems.push({
            key: GridUtil.generateKey(),
            component: FillLifter,
            row: 3,
            column: GlobalConst.DefaultStartCol,
          });
          iniItems.push({
            key: GridUtil.generateKey(),
            component: TextCompt,
            text: text,
            row: 1,
            column: GlobalConst.DefaultStartCol + 1,
            iniType: XmlTags.C_Wei,
            textType: TextType.SOLID,
          });
        }
        GridUtil.addColumn(pCompt, col);
        GridUtil.addItem(
          GridCompt,
          pCompt,
          1,
          col,
          refCompt.iniType,
          null,
          '',
          iniItems
        );

        pCompt.$nextTick(() => {
          let newCompt = pCompt.childrenItems.find(
            (o) => o.column == col && o.belongType(GridCompt)
          );
          if (newCompt != undefined) {
            newCompt.active();
          }
        });
      }
      return true;
    },

    addObj(refCompt, moveText) {
      // console.log(refCompt);
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：谓语或Generic
      if (
        refCompt.iniType != XmlTags.C_Wei &&
        refCompt.iniType != XmlTags.O_Temp
      )
        return false;

      // 约束：非顶起谓语
      if (refCompt.iniType == XmlTags.C_Wei && !refCompt.belongType(TextCompt))
        return false;

      let ext = refCompt.prdExtend();
      // console.log(ext);
      if (ext == PrdExtend.SYN) return false;

      let pCompt = refCompt.parentCompt;

      let col = refCompt.column;
      let rr = refCompt.rightRegion();
      let removeObj = false;

      let elems = GridUtil.findElemsByCol(pCompt, col, col + rr, ObjSep);
      // 约束：双宾语限制
      if (elems.length > 1) return false;
      else if (elems.length == 1) {
        // 约束：宾语倒装限制
        if (elems[0].isShift) return false;

        // 后续为空宾语
        let child = pCompt.getChild(1, elems[0].column + 1, TextCompt);
        if (child != null && child.text.trim().length == 0) removeObj = true;

        // 限制：谓宾之间有补语，则不能再切分双宾
        let cmps = GridUtil.findElemsByCol(
          pCompt,
          col,
          elems[0].column,
          TextCompt
        );
        if (cmps.some((o) => o.iniType == XmlTags.C_Bu) && !removeObj)
          return false;
      }

      if (refCompt.iniType == XmlTags.O_Temp)
        refCompt.updateParentItem('iniType', XmlTags.C_Wei);

      // 采用先移除后添加方式，兼容谓宾间补语等成分需要前移的情况
      if (removeObj) {
        GridUtil.removeAssist(pCompt, ObjSep, col, col + rr);
      }

      let newCol = col + 1;
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(TextCompt, pCompt, 1, newCol, XmlTags.C_Bin);
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(ObjSep, pCompt, 1, newCol);
      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == newCol + 1 && o.belongType(TextCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          if (moveText) {
            let text = refCompt.textExtract(TextRegion.BEHIND, true).trim();
            newCompt.textFill(text, TextRegion.FRONT);
          }
        }
      });
      return true;
    },

    addAtt(refCompt, moveText, type, event) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：需是主语或宾语或Generic
      if (
        refCompt.iniType != XmlTags.C_Zhu &&
        refCompt.iniType != XmlTags.C_Bin &&
        refCompt.iniType != XmlTags.O_Temp
      )
        return false;

      // if (refCompt.iniType == XmlTags.O_Temp)
      //   refCompt.updateParentItem("iniType", XmlTags.C_Bin);

      if (event != null && event.ctrlKey) {
        let wu = refCompt.wordUnit;
        let words = wu.words;
        let text = words.innerText;
        let matches = [...text.matchAll(/[的之][\s、，）]*/g)];
        // console.log(matches)
        if (matches != null && matches.length > 0) {
          let i = 0;
          let idx = 0;
          // 前向添加，采用定时器方式
          let int = setInterval(() => {
            const m = matches[i];
            // console.log(m)
            wu.setWordsCaret(words, m.index + m[0].length - idx);
            idx = m.index + m[0].length;
            this.addAtt(refCompt);
            i++;
            if (i >= matches.length) clearInterval(int);
          }, 1);

          return true;
        }
      }

      let col = refCompt.column;
      let pCompt = refCompt.parentCompt;
      let text = refCompt.textExtract(TextRegion.FRONT, true).trim();
      let iniItems = GridUtil.iniGridComptItems(XmlTags.C_Ding);
      GridUtil.addColumn(pCompt, col);
      GridUtil.addItem(
        GridCompt,
        pCompt,
        3,
        col,
        XmlTags.C_Ding,
        null,
        '',
        iniItems
      );

      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == col && o.belongType(GridCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          newCompt.textFill(text, TextRegion.ALL);

          if (refCompt.iniType == XmlTags.O_Temp) updateChildrenType(pCompt);
        }
      });

      return true;
    },

    addAdv(refCompt, moveText, type, event, position) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：需是主语或谓语或Generic
      if (!refCompt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.O_Temp))
        return false;

      let pCompt = refCompt.parentCompt;
      // 约束：独词句
      if (refCompt.isOnlySbj) return false;

      // 约束：主语倒装
      if (
        refCompt.iniType == XmlTags.C_Zhu &&
        pCompt.childrenItems.firstOrDefault((o) => o.belongType(SbjSep)).isShift
      )
        return false;

      // 后置状语，逻辑是否保留？？

      let newCol = refCompt.column;
      if (refCompt.iniType == XmlTags.C_Zhu) {
        newCol = newCol - refCompt.leftRegion(1);
      }
      if (position != null) newCol = position;

      let iniItems = GridUtil.iniGridComptItems(XmlTags.C_Zhuang);
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(
        GridCompt,
        pCompt,
        3,
        newCol,
        XmlTags.C_Zhuang,
        null,
        '',
        iniItems
      );

      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == newCol && o.belongType(GridCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          if (moveText) {
            let text = refCompt.textExtract(TextRegion.FRONT, true).trim();
            newCompt.textFill(text, TextRegion.ALL);
          }

          if (refCompt.iniType == XmlTags.O_Temp) updateChildrenType(pCompt);
        }
      });
      return true;
    },

    addCmp(refCompt) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：需是谓语或宾语或Generic
      if (
        refCompt.iniType != XmlTags.C_Wei &&
        refCompt.iniType != XmlTags.C_Bin &&
        refCompt.iniType != XmlTags.O_Temp
      )
        return false;

      let col = refCompt.column;
      let pCompt = refCompt.parentCompt;

      // 约束：如果从宾语上添加，前面必须有谓语
      if (
        refCompt.iniType == XmlTags.C_Bin &&
        pCompt.childrenItems.every((o) => o.iniType != XmlTags.C_Wei)
      )
        return false;

      // 约束：有宾语倒装不能添加
      let nearObjs = null;
      if (refCompt.iniType == XmlTags.C_Bin)
        nearObjs = GridUtil.findElemsByCol(pCompt, 1, col, ObjSep);
      else if (refCompt.iniType == XmlTags.C_Wei)
        nearObjs = GridUtil.findElemsByCol(
          pCompt,
          col,
          GlobalConst.GridMaxCol,
          ObjSep
        );
      if (
        nearObjs != null &&
        nearObjs.length > 0 &&
        nearObjs.lastOrDefault().isShift
      )
        return null;

      // 约束：一个谓语只能有一个补语
      let curPrd = null;
      if (refCompt.iniType == XmlTags.C_Wei) curPrd = refCompt;
      else if (refCompt.iniType == XmlTags.C_Bin)
        curPrd = refCompt.nearestLeftCompt(XmlTags.C_Wei);

      if (curPrd != null) {
        // 约束：合成谓语后面不能切补语
        if (curPrd.prdExtend() == PrdExtend.SYN) return false;

        let prdCol = curPrd.column;
        let rr = curPrd.rightRegion();
        let elems = GridUtil.findElemsByCol(
          pCompt,
          prdCol,
          prdCol + rr,
          GridCompt
        ).filter((o) => o.belongIniType(XmlTags.C_Bu));
        if (elems.length > 0) return false;

        // 约束：双宾语中间宾语不能有补语
        if (refCompt.iniType == XmlTags.C_Bin) {
          rr = prdCol + rr;
          let objSep = GridUtil.findElemByCol(pCompt, col, rr, ObjSep);
          if (objSep) return false;
        }
      }

      let newCol = col + 1;
      // console.log(newCol);
      if (refCompt.iniType == XmlTags.C_Bin) {
        newCol += refCompt.rightRegion(1);
      }

      let text = refCompt.textExtract(TextRegion.BEHIND, true).removeSpace();
      let iniItems = GridUtil.iniGridComptItems(XmlTags.C_Bu);
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(
        GridCompt,
        pCompt,
        3,
        newCol,
        XmlTags.C_Bu,
        null,
        '',
        iniItems
      );

      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == newCol && o.belongType(GridCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          newCompt.textFill(text, TextRegion.ALL);
        }

        if (refCompt.iniType == XmlTags.O_Temp) updateChildrenType(pCompt);
      });

      return true;
    },

    addPrevInd(refCompt) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：不能是VIRTUAL    20211224:放开Generic限制
      if (refCompt.textType == TextType.VIRTUAL) return false;

      let col = refCompt.column;
      let pCompt = refCompt.parentCompt;
      let text = refCompt.textExtract(TextRegion.FRONT, true).trim();
      let iniItems = GridUtil.iniGridComptItems(XmlTags.C_Ind);
      GridUtil.addColumn(pCompt, col);
      GridUtil.addItem(
        GridCompt,
        pCompt,
        3,
        col,
        XmlTags.C_Ind,
        null,
        '',
        iniItems
      );

      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == col && o.belongType(GridCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          newCompt.textFill(text, TextRegion.ALL);

          if (refCompt.belongIniType(XmlTags.O_Temp))
            updateChildrenType(pCompt);
        }
      });

      return true;
    },

    addNextInd(refCompt) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：不能是VIRTUAL    20211224:放开Generic限制
      if (refCompt.textType == TextType.VIRTUAL) return false;

      // 约束：合成谓语后面不能切独立语
      if (
        refCompt.belongIniType(XmlTags.C_Wei) &&
        refCompt.prdExtend() == PrdExtend.SYN
      )
        return false;

      let col = refCompt.column;
      let pCompt = refCompt.parentCompt;
      let newCol = col + 1;
      // 谓语后为一个空宾语，独立语切到宾语后
      let rr = refCompt.rightRegion();
      let rrCompts = GridUtil.findElemsByCol(
        pCompt,
        col + 1,
        col + rr,
        BaseCompt
      );
      let rrObj = rrCompts.firstOrDefault((o) =>
        o.belongIniType(XmlTags.C_Bin)
      );
      if (
        rrCompts.length == 1 &&
        rrObj != null &&
        rrObj.belongType(TextCompt) &&
        rrObj.text == ''
      ) {
        newCol += rr;
      }

      let text = refCompt.textExtract(TextRegion.BEHIND, true).trim();
      let iniItems = GridUtil.iniGridComptItems(XmlTags.C_Ind);
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(
        GridCompt,
        pCompt,
        3,
        newCol,
        XmlTags.C_Ind,
        null,
        '',
        iniItems
      );

      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == newCol && o.belongType(GridCompt)
        );
        if (newCompt != undefined) {
          newCompt.active();
          newCompt.textFill(text, TextRegion.ALL);

          if (refCompt.belongIniType(XmlTags.O_Temp))
            updateChildrenType(pCompt);
        }
      });

      return true;
    },

    addPrevVirtual(refCompt, moveText, type, event) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      let iniType = refCompt.iniType;
      // 约束：主语/谓语/宾语/Generic
      let limitTypes = [
        XmlTags.C_Zhu,
        XmlTags.C_Wei,
        XmlTags.C_Bin,
        XmlTags.O_Temp,
      ];
      if (!limitTypes.contains(iniType)) return false;

      // 约束：连词/介词/UN/UV
      limitTypes = [XmlTags.C_CC, XmlTags.C_PP, XmlTags.C_UN, XmlTags.C_UV];
      if (!limitTypes.contains(type)) return false;

      // 约束：主、宾语不能出UV
      if (
        refCompt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin) &&
        type == XmlTags.C_UV
      )
        return false;

      if (event && event.shiftKey && type == XmlTags.C_PP) {
        return this.addNextVirtual(refCompt, moveText, type, event);
      }

      let pCompt = refCompt.parentCompt;
      let toPPObj = false; // 谓宾转介宾
      let toPPSbj = false; // 谓宾转介主独词
      // 约束：谓语只能出CC和UV 或 谓宾转介宾 或 谓宾转介主独词
      if (refCompt.belongIniType(XmlTags.C_Wei)) {
        if (type == XmlTags.C_PP) {
          // 定状补中的谓语切介词转介宾 单谓核且@scp="VO"
          if (
            pCompt.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Bu)
          ) {
            let scp = GridUtil.contextOfPrd(refCompt, null, false);
            if (scp != XmlTags.V_SCP_VO) return false;

            toPPObj = true;
          }
          // 主干谓宾转介主独词 左边成分都为空 单谓核且@scp以VO结尾
          else if (pCompt.belongIniType(XmlTags.O_Sent)) {
            let leftCompts = refCompt.leftCompts();
            if (leftCompts.some((o) => o.toXml().textContent != '')) return;

            let scp = GridUtil.contextOfPrd(refCompt, null, false);
            if (!scp.endsWith(XmlTags.V_SCP_VO)) return false;

            toPPSbj = true;
          }
          // 其他情况
          else return false;
        } else if (type != XmlTags.C_CC && type != XmlTags.C_UV) return false;
      }

      // 约束：合成、连动、兼语分隔符后不能出CC
      let leftElem = refCompt.nearestLeftElem();
      if (
        type == XmlTags.C_CC &&
        leftElem != null &&
        leftElem.belongType(PrdSep) &&
        leftElem.prdType != XmlTags.V_Fun_UNI
      )
        return false;

      // 约束：主、宾  左边非状、连则不能出连词
      let leftCompt = refCompt.nearestLeftCompt();
      if (
        refCompt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin) &&
        type == XmlTags.C_CC &&
        leftCompt != null &&
        !leftCompt.belongIniType(
          XmlTags.C_Ding,
          XmlTags.C_Zhuang,
          XmlTags.C_CC,
          XmlTags.V_Fun_APP,
          XmlTags.V_Fun_COO,
          XmlTags.V_Fun_UNI
        )
      )
        return false;

      let text = refCompt
        .textExtract(toPPSbj ? TextRegion.ALL : TextRegion.FRONT, true)
        .trim();
      // 1.合并到已有联合结构连词位
      if (
        type == XmlTags.C_CC &&
        leftCompt != null &&
        leftCompt.belongIniType(
          XmlTags.V_Fun_APP,
          XmlTags.V_Fun_COO,
          XmlTags.V_Fun_UNI
        )
      ) {
        if (text != '') leftCompt.textFill(text, TextRegion.BEHIND);
        return true;
      }

      // 2.相同成分合并
      if (
        leftCompt &&
        (leftCompt.belongIniType(type) ||
          (leftCompt.belongIniType(XmlTags.V_Fun_UNI1, XmlTags.C_CC) &&
            [XmlTags.V_Fun_UNI1, XmlTags.C_CC].contains(type)))
      ) {
        if (text != '') leftCompt.textFill(text, TextRegion.BEHIND);
        return true;
      }

      // 2.1切分到定语前的介词
      let newCol =
        refCompt.column -
        (type == XmlTags.C_PP ? refCompt.leftRegion(0, 0) : 0);
      let leftPP = refCompt.nearestLeftCompt(XmlTags.C_PP);
      if (type == XmlTags.C_PP && leftPP != null && leftPP.column == newCol) {
        if (text != '') leftPP.textFill(text, TextRegion.BEHIND);
        return true;
      }

      // 3.添加新成分
      // console.log(type)
      if (toPPSbj) {
        for (let i = newCol + 1; i >= GlobalConst.DefaultStartCol; i--) {
          GridUtil.delColumn(pCompt, i);
        }
        newCol = GlobalConst.DefaultStartCol;
      }
      GridUtil.addColumn(pCompt, newCol);
      if (
        type == XmlTags.C_CC &&
        leftCompt &&
        leftCompt.belongIniType(XmlTags.C_Ding)
      ) {
        GridUtil.addItem(
          TextCompt,
          pCompt,
          3,
          newCol,
          XmlTags.V_Fun_COO1,
          null,
          '',
          null,
          TextType.VIRTUAL
        );
        GridUtil.addItem(WordFlag, pCompt, 3, newCol, XmlTags.V_Fun_COO1);
      } else {
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          newCol,
          type,
          null,
          '',
          null,
          TextType.VIRTUAL
        );
        GridUtil.addItem(WordFlag, pCompt, 3, newCol, type);
      }
      if (toPPObj) {
        GridUtil.delColumn(pCompt, newCol + 1);
        GridUtil.delColumn(pCompt, newCol + 1);
      }

      pCompt.$nextTick(() => {
        pCompt.active();
        if (refCompt.belongIniType(XmlTags.O_Temp)) updateChildrenType(pCompt);

        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == newCol && o.belongType(TextCompt)
        );
        if (newCompt != null) {
          newCompt.textFill(text, TextRegion.FRONT);

          if (toPPSbj) {
            let objs = pCompt.childrenItems.filter((o) =>
              o.belongIniType(XmlTags.C_Bin)
            );
            objs.forEach((o) => o.updateParentItem('iniType', XmlTags.C_Zhu));
          }
        }
      });
      return true;
    },

    addNextVirtual(refCompt, moveText, type) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      let iniType = refCompt.iniType;
      // 约束：主语/谓语/宾语/Generic
      let limitTypes = [
        XmlTags.C_Zhu,
        XmlTags.C_Wei,
        XmlTags.C_Bin,
        XmlTags.O_Temp,
      ];
      if (!limitTypes.contains(iniType)) return false;

      // 约束：连词/介词/UN/UV
      limitTypes = [XmlTags.C_FF, XmlTags.C_PP, XmlTags.C_UN, XmlTags.C_UV];
      if (!limitTypes.contains(type)) return false;

      // 约束：谓语只能出UV
      if (iniType == XmlTags.C_Wei && type != XmlTags.C_UV) return;

      // 约束：主语不能出UV
      if (iniType == XmlTags.C_Zhu && type == XmlTags.C_UV) return;

      // 1.相同成分合并
      let rightCompt = refCompt.nearestRightCompt();
      if (rightCompt != null && rightCompt.belongIniType(type)) {
        let text = refCompt.textExtract(TextRegion.BEHIND, true).trim();
        if (text != '') rightCompt.textFill(text, TextRegion.FRONT);
        return true;
      }

      // 2.添加新成分
      let pCompt = refCompt.parentCompt;
      let col = refCompt.column;
      let newCol = col + 1;

      // 2.1 谓语后为一个空宾语，UV切到宾语后
      if (type == XmlTags.C_UV) {
        let rr = refCompt.rightRegion();
        let rrCompts = GridUtil.findElemsByCol(
          pCompt,
          col + 1,
          col + rr,
          BaseCompt
        );
        let rrObj = rrCompts.firstOrDefault((o) =>
          o.belongIniType(XmlTags.C_Bin)
        );
        if (
          rrCompts.length == 1 &&
          rrObj != null &&
          rrObj.belongType(TextCompt) &&
          rrObj.text == ''
        ) {
          newCol += rr;
        }
      }

      // 1.1 UV合并
      let rightUV = refCompt.nearestRightCompt(XmlTags.C_UV);
      if (type == XmlTags.C_UV && rightUV != null && rightUV.column == newCol) {
        let text = refCompt.textExtract(TextRegion.BEHIND, true).trim();
        if (text != '') rightUV.textFill(text, TextRegion.FRONT);
        return true;
      }

      // console.log(type)
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        1,
        newCol,
        type,
        null,
        '',
        null,
        TextType.VIRTUAL
      );
      GridUtil.addItem(WordFlag, pCompt, 3, newCol, type);
      pCompt.$nextTick(() => {
        pCompt.active();
        if (refCompt.iniType == XmlTags.O_Temp) updateChildrenType(pCompt);

        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == newCol && o.belongType(TextCompt)
        );
        if (newCompt != null) {
          let text = refCompt.textExtract(TextRegion.BEHIND, true).trim();
          newCompt.textFill(text, TextRegion.FRONT);
        }
      });
      return true;
    },

    extendCore(refCompt) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：主语/谓语/宾语/Generic
      let limitTypes = [
        XmlTags.C_Zhu,
        XmlTags.C_Wei,
        XmlTags.C_Bin,
        XmlTags.O_Temp,
      ];
      if (!limitTypes.contains(refCompt.iniType)) return false;

      if (refCompt.iniType == XmlTags.C_Wei)
        return this.extendVpCore(refCompt, null, XmlTags.V_Fun_UNI);
      else return this.extendNpCore(refCompt, null, XmlTags.V_Fun_COO);
    },

    extendNpCore(refCompt, moveText, type, event) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：主语/宾语/Generic
      if (
        refCompt.iniType != XmlTags.C_Zhu &&
        refCompt.iniType != XmlTags.C_Bin &&
        refCompt.iniType != XmlTags.O_Temp
      )
        return false;

      // 约束：同位/并列
      if (type != XmlTags.V_Fun_APP && type != XmlTags.V_Fun_COO) return false;

      // if (refCompt.iniType == XmlTags.O_Temp)
      //   refCompt.updateParentItem("iniType", XmlTags.C_Bin);

      // console.log(event)
      if (event != null && event.ctrlKey) {
        let wu = refCompt.wordUnit;
        let words = wu.words;
        let text = words.innerText;
        let pattern =
          type == XmlTags.V_Fun_COO
            ? GlobalConst.CooSepRegex
            : GlobalConst.AutoConjunct_APP;
        let reg = new RegExp(pattern);
        let match = text.match(reg);
        if (match != null) {
          wu.setWordsCaret(words, match.index);
          this.extendNpCore(refCompt, null, type);
          text = text.substring(0, match.index);
        }
        // 逗号或顿号后插入并列结构
        if (type == XmlTags.V_Fun_COO) {
          let matches = [...text.matchAll(/(，|、).*?\S/g)];
          if (matches != null) {
            for (let i = matches.length - 1; i >= 0; i--) {
              const m = matches[i];
              // console.log(m)
              wu.setWordsCaret(words, m.index + 1);
              this.extendNpCore(refCompt, null, type);
            }
            return true;
          }
        }
      }

      let pCompt = refCompt.parentCompt;
      let col = refCompt.column;
      let newCol = col + 1;
      // let tcType = refCompt.iniType == XmlTags.O_Temp ? XmlTags.C_Bin : refCompt.iniType;
      let tcType = refCompt.iniType;
      let tcText = refCompt.textExtract(TextRegion.BEHIND, true).trim();
      let vText = '';
      let refText = refCompt
        .textExtract(TextRegion.ALL, false)
        .replace(/，|,/, '')
        .trim();
      let refTextCore = refText.substring(refText.lastIndexOf('的') + 1);

      // 判断同位：1、切分文字符合同位正则；2、剩余文字（“的”字核心）是切分文字的结尾；3、剩余文字破折号结尾
      let r6Reg = new RegExp('^(?:' + GlobalConst.R6Regex + ')');
      if (
        r6Reg.test(tcText) ||
        /—/.test(refText) ||
        (refTextCore != '' && tcText.replace(/，|,/, '').endsWith(refTextCore))
      )
        type = XmlTags.V_Fun_APP;

      // 连词文字自动切分判断
      let exp =
        type == XmlTags.V_Fun_COO
          ? GlobalConst.AutoConjunct_COO
          : GlobalConst.AutoConjunct_APP;
      let reg = new RegExp('^(?:' + exp + ')');
      let match = tcText.match(reg);
      if (match != null) {
        vText = tcText.substring(0, match[0].length);
        tcText = tcText.substring(match[0].length);
      }

      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        1,
        newCol,
        tcType,
        null,
        tcText.insertPuncSpace()
      );
      GridUtil.addColumn(pCompt, newCol);
      GridUtil.addItem(WordFlag, pCompt, 3, newCol, type);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        1,
        newCol,
        type,
        null,
        vText.insertPuncSpace(),
        null,
        TextType.VIRTUAL
      );

      pCompt.$nextTick(() => {
        pCompt.active();
        if (refCompt.iniType == XmlTags.O_Temp) updateChildrenType(pCompt);
      });
      return true;
    },

    extendVpCore(refCompt, moveText, type, event) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：谓语/宾语/Generic
      if (
        refCompt.iniType != XmlTags.C_Wei &&
        refCompt.iniType != XmlTags.C_Bin &&
        refCompt.iniType != XmlTags.O_Temp
      )
        return false;

      // 约束：合成/联合/连动/兼语
      let limitTypes = [
        XmlTags.V_Fun_SYN,
        XmlTags.V_Fun_UNI,
        XmlTags.V_Fun_SER,
        XmlTags.V_Fun_PVT,
      ];
      if (!limitTypes.contains(type)) return false;

      // 约束：宾语不能切合成
      if (refCompt.iniType == XmlTags.C_Bin && type == XmlTags.V_Fun_SYN)
        return false;

      let pCompt = refCompt.parentCompt;
      // 约束：宾语前没有谓语时，不能切VP联合
      if (
        refCompt.belongIniType(XmlTags.C_Bin) &&
        pCompt.childrenItems.every((o) => !o.belongIniType(XmlTags.C_Wei))
      )
        return false;

      // 约束：宾语后接NP成分时，不能切VP联合
      let rightCompt = refCompt.nearestRightCompt();
      if (
        refCompt.belongIniType(XmlTags.C_Bin) &&
        rightCompt != null &&
        rightCompt.belongIniType(XmlTags.Np_Compt)
      )
        return false;

      // console.log(event)
      if (type == XmlTags.V_Fun_UNI && event != null && event.ctrlKey) {
        let wu = refCompt.wordUnit;
        let words = wu.words;
        let text = words.innerText;
        let reg = new RegExp(GlobalConst.UniSepRegex);
        let match = text.match(reg);
        if (match != null) {
          wu.setWordsCaret(words, match.index);
        }
        // 顿号后插入并列结构
        else {
          let matches = [...text.matchAll(/、.*?\S/g)];
          if (matches != null && matches.length > 0) {
            let i = matches.length - 1;
            // 有延时补充空宾语逻辑，采用定时器方式
            let int = setInterval(() => {
              const m = matches[i];
              wu.setWordsCaret(words, m.index + 1);
              this.extendVpCore(refCompt, null, type);
              i--;
              if (i < 0) clearInterval(int);
            }, 1);
            return true;
          }
        }
      }

      if (refCompt.iniType == XmlTags.O_Temp)
        refCompt.updateParentItem('iniType', XmlTags.C_Wei);

      let col = refCompt.column;
      let newCol = type == XmlTags.V_Fun_SYN ? col : col + 1;
      let tcText =
        type == XmlTags.V_Fun_SYN
          ? refCompt.textExtract(TextRegion.FRONT, true).trim()
          : refCompt.textExtract(TextRegion.BEHIND, true).trim();
      let remain = refCompt.textExtract(TextRegion.ALL);
      let vText = '';
      let ccReg = new RegExp('^(?:' + GlobalConst.AutoConjunct_UNI + ')');

      // 根据开始文字判断兼语，宾语位置则向前查找谓语
      if (type == XmlTags.V_Fun_UNI) {
        let belongPrd = refCompt.belongIniType(XmlTags.C_Bin)
          ? refCompt.nearestLeftCompt(XmlTags.C_Wei)
          : null;
        let v4Reg = new RegExp('^(?:' + GlobalConst.V4Regex + ')');
        // 符合v4且不以逗号结尾
        if (
          (belongPrd != null &&
            v4Reg.test(belongPrd.text) &&
            !belongPrd.text.endsWith('，')) ||
          (v4Reg.test(remain) && !remain.endsWith('，') && !ccReg.test(tcText))
        )
          type = XmlTags.V_Fun_PVT;
      }

      // 连词文字自动切分判断
      if (type == XmlTags.V_Fun_UNI) {
        let match = tcText.match(ccReg);
        if (match != null) {
          vText = tcText.substring(0, match[0].length);
          tcText = tcText.substring(match[0].length);
        }
      }

      if (type == XmlTags.V_Fun_SYN) {
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(PrdSep, pCompt, 1, newCol, type);
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          newCol,
          XmlTags.C_Wei,
          null,
          tcText
        );
      } else {
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          newCol,
          XmlTags.C_Wei,
          null,
          tcText
        );
        GridUtil.addColumn(pCompt, newCol);
        if (type == XmlTags.V_Fun_UNI)
          GridUtil.addItem(
            TextCompt,
            pCompt,
            1,
            newCol,
            XmlTags.V_Fun_UNI,
            null,
            vText,
            null,
            TextType.VIRTUAL
          );
        GridUtil.addItem(PrdSep, pCompt, 1, newCol, type);
      }

      pCompt.$nextTick(() => {
        pCompt.active(); //如后期有效率问题，则改为获取需要激活的成分，单独激活

        // 补充空宾语
        if (type != XmlTags.V_Fun_SYN && refCompt.isInMainLine) {
          if (refCompt.iniType == XmlTags.C_Bin) {
            let newCompt = pCompt.childrenItems.find(
              (o) => o.column == newCol + 1 && o.belongType(TextCompt)
            );
            if (newCompt != null) {
              this.addObj(newCompt, false);
            }
          } else this.addObj(refCompt, false);
        }
      });
      return true;
    },

    extendStack(refCompt, moveText, type, event, position, newXml) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      // 约束：主语/谓语/宾语/Generic
      let limitTypes = [
        XmlTags.C_Zhu,
        XmlTags.C_Wei,
        XmlTags.C_Bin,
        XmlTags.O_Temp,
      ];
      if (!limitTypes.contains(refCompt.iniType)) return false;

      if (refCompt.isOnlySbj) return false;

      if (moveText == null) moveText = true;

      let diagram = refCompt.ancestor(Diagram);
      let pCompt = refCompt.parentCompt;
      let pCol = pCompt.column;
      let ppCompt = pCompt.parentCompt;
      let col = refCompt.column;
      // 按住Ctrl时，按逗号断句切分
      if (event != null && event.ctrlKey) {
        let wu = refCompt.wordUnit;
        let words = wu.words;
        let wuText = words.innerText;
        if (/，.*?\S/.test(wuText)) {
          // 有 Grid->Stack逻辑，采用定时器方式
          let int = setInterval(() => {
            // Grid->Stack后，原refCompt会消失
            if (refCompt._isDestroyed) {
              let newGrid;
              // 外层小句，谓语位置扩展复句
              if (ppCompt == null && refCompt.belongIniType(XmlTags.C_Wei))
                newGrid = diagram.compt.gridCompts()[0];
              // 定、状、补、独中扩展复句
              else if (ppCompt != null)
                newGrid = GridUtil.findElemByCol(
                  ppCompt,
                  pCol - 1,
                  pCol,
                  StackCompt
                ).gridCompts()[0];
              // 主宾位置扩展顶起复句
              else
                newGrid = GridUtil.findElemByCol(
                  pCompt,
                  col - 1,
                  col,
                  StackCompt
                ).gridCompts()[0];

              refCompt = newGrid.childrenItems.firstOrDefault((o) =>
                o.belongIniType(XmlTags.C_Wei)
              );
              wu = refCompt.wordUnit;
              words = wu.words;
              // clearInterval(int);
              // return;
            }
            wuText = words.innerText;
            let matches = [...wuText.matchAll(/，.*?\S/g)];
            let i = matches.length - 1;
            const m = matches[i];
            wu.setWordsCaret(words, m.index + 1);
            this.extendStack(refCompt);
            i--;
            if (i < 0) clearInterval(int);
          }, 1);
          return true;
        }
      }

      let text = moveText
        ? refCompt.textExtract(TextRegion.BEHIND, true).trim()
        : '';
      let leftText = refCompt.textExtract(TextRegion.ALL, false).trim();
      let cornerXml;
      // console.log(refCompt);
      // C1 在谓语上进行扩展
      if (refCompt.iniType == XmlTags.C_Wei) {
        // 1.1 Stack中新添加句子
        if (pCompt.isInStack) {
          // 新增小句
          let row = position != null ? position : pCompt.row + 1;
          let iniItems = null;
          let gIniType = pCompt.isMainSent ? XmlTags.O_Sent : pCompt.iniType;
          let sentId = pCompt.sentId;
          let ignore = pCompt.ignore;
          GridUtil.addRow(pCompt.parentCompt, row);
          if (newXml == null)
            iniItems = pCompt.isMainSent
              ? GridUtil.iniSVOItems()
              : GridUtil.iniVItems();
          GridUtil.addItem(
            GridCompt,
            pCompt.parentCompt,
            row,
            1,
            gIniType,
            newXml,
            '',
            iniItems
          );

          pCompt.parentCompt.$nextTick(() => {
            let newCompt = pCompt.parentCompt.childrenItems.find(
              (o) => o.row == row && o.belongType(GridCompt)
            );
            if (newCompt != undefined) {
              newCompt.active();

              if (newXml) newCompt.fromXml();
              else newCompt.textFill(text, TextRegion.ALL);
              newCompt.sentId = sentId;
              newCompt.ignore = ignore;
              if (sentId > 0) newCompt.showExpand = true;
            }
          });
          return true;
        }

        // 1.2 定、状、补、独中Grid到Stack    1.3 顶起Grid到Stack
        if (refCompt.isInBlock || !refCompt.isInMainLine) {
          GridUtil.delColumn(ppCompt, pCol); //删除旧GridCompt

          // 定状补corner处理
          if (refCompt.isInBlock && pCompt.cornerCompt != null) {
            let corner = pCompt.cornerCompt;
            if (corner.text != '') cornerXml = corner.toXml().cloneNode(true);
            GridUtil.delColumn(pCompt, corner.column);
          }

          let newGRow = position == null ? 2 : position;
          let oldGRow = position == null ? 1 : position == 1 ? 2 : position - 1;
          let xml = XmlParser.adjustGridXml(pCompt.toXml().cloneNode(true));
          let iniItems = [];
          iniItems.push({
            key: GridUtil.generateKey(),
            component: GridCompt,
            row: oldGRow,
            column: 1,
            iniType: pCompt.iniType,
            xml: xml,
          });
          iniItems.push({
            key: GridUtil.generateKey(),
            component: GridCompt,
            row: newGRow,
            column: 1,
            iniType: pCompt.iniType,
            iniItems: GridUtil.iniVItems(),
          });
          let row = refCompt.isInBlock ? 3 : 1;
          GridUtil.addColumn(ppCompt, pCol);
          GridUtil.addItem(
            StackCompt,
            ppCompt,
            row,
            pCol,
            pCompt.iniType,
            null,
            '',
            iniItems
          );

          ppCompt.$nextTick(() => {
            let newCompt = ppCompt.childrenItems.find(
              (o) => o.column == pCol && o.belongType(StackCompt)
            );
            if (newCompt != null) {
              newCompt.active();
              let gridCompt = newCompt.childrenItems.find(
                (o) => o.row == oldGRow && o.belongType(GridCompt)
              );
              if (gridCompt != null) gridCompt.fromXml();

              gridCompt = newCompt.childrenItems.find(
                (o) => o.row == newGRow && o.belongType(GridCompt)
              );
              if (gridCompt != null) {
                if (newXml) gridCompt.fromXml();
                else gridCompt.textFill(text, TextRegion.ALL);
              }

              if (refCompt.isInBlock && cornerXml)
                newCompt.setCornerXml(cornerXml);
            }
          });
          return true;
        }

        // 1.4 小句Grid扩展为Stack
        let xml = pCompt.toXml().cloneNode(true);
        diagram.type = StackCompt;
        diagram.$nextTick(() => {
          let newGRow = position == null ? 2 : position;
          let oldGRow = position == null ? 1 : position == 1 ? 2 : position - 1;
          // 原先小句，后边通过xml还原
          GridUtil.addItem(
            GridCompt,
            diagram.compt,
            oldGRow,
            1,
            XmlTags.O_Sent,
            xml
          );
          // 新增小句
          let iniItems = null;
          if (newXml == null) iniItems = GridUtil.iniSVOItems();
          GridUtil.addItem(
            GridCompt,
            diagram.compt,
            newGRow,
            1,
            XmlTags.O_Sent,
            newXml,
            '',
            iniItems
          );
          diagram.$nextTick(() => {
            diagram.active();

            let sentId = 0;
            let ignore = false;
            let newCompt = diagram.compt.childrenItems.find(
              (o) => o.row == oldGRow && o.belongType(GridCompt)
            );
            if (newCompt != null) {
              newCompt.fromXml();
              sentId = newCompt.sentId;
              ignore = newCompt.ignore;
            }
            newCompt = diagram.compt.childrenItems.find(
              (o) => o.row == newGRow && o.belongType(GridCompt)
            );
            if (newCompt != null) {
              if (newXml != null) newCompt.fromXml();
              else newCompt.textFill(text, TextRegion.ALL);
              newCompt.sentId = sentId;
              newCompt.ignore = ignore;
              if (sentId > 0) newCompt.showExpand = true;
            }
          });
        });

        return true;
      }

      // c2 主宾位置，直接顶起复句 / Generic直接扩展为复句
      let iniType = refCompt.iniType;
      if (refCompt.belongIniType(XmlTags.O_Temp)) {
        let pCol = pCompt.column;
        let ppCompt = pCompt.parentCompt;
        // GridUtil.delColumn(ppCompt, pCol); //删除旧GridCompt
        // 定状补corner处理
        if (refCompt.isInBlock && pCompt.cornerCompt != null) {
          let corner = pCompt.cornerCompt;
          if (corner.text != '') cornerXml = corner.toXml().cloneNode(true);
          GridUtil.delColumn(pCompt, corner.column);
        }
        col = pCol;
        iniType = pCompt.iniType;
        pCompt = ppCompt;
      }
      // console.log(pCompt)
      GridUtil.delColumn(pCompt, col);
      let iniItems = [];
      iniItems.push({
        key: GridUtil.generateKey(),
        component: GridCompt,
        row: 1,
        column: 1,
        iniType: iniType,
        iniItems: GridUtil.iniVItems(),
      });
      iniItems.push({
        key: GridUtil.generateKey(),
        component: GridCompt,
        row: 2,
        column: 1,
        iniType: iniType,
        iniItems: GridUtil.iniVItems(),
      });

      let row = refCompt.belongIniType(XmlTags.O_Temp) ? 3 : 1;
      GridUtil.addColumn(pCompt, col);
      GridUtil.addItem(
        StackCompt,
        pCompt,
        row,
        col,
        iniType,
        null,
        '',
        iniItems
      );
      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == col && o.belongType(StackCompt)
        );
        if (newCompt != null) {
          newCompt.active();
          let gridCompt = newCompt.childrenItems.find(
            (o) => o.row == 1 && o.belongType(GridCompt)
          );
          if (gridCompt != null) gridCompt.textFill(leftText, TextRegion.ALL);
          gridCompt = newCompt.childrenItems.find(
            (o) => o.row == 2 && o.belongType(GridCompt)
          );
          if (gridCompt != null) gridCompt.textFill(text, TextRegion.ALL);

          if (refCompt.isInBlock && cornerXml) newCompt.setCornerXml(cornerXml);
        }
      });

      return true;
    },

    // 水平拆分出相同成分
    splitCompt(refCompt) {
      if (refCompt == null || refCompt.parentCompt == null) return false;

      let pCompt = refCompt.parentCompt;
      // 限制：定、状中的Generic、连词位CC
      if (
        !(
          refCompt.belongIniType(XmlTags.O_Temp) &&
          pCompt.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Bu)
        ) &&
        !refCompt.belongIniType(XmlTags.C_CC)
      )
        return false;

      if (pCompt.belongIniType(XmlTags.C_Bu)) {
        let prrcs = pCompt.nearestLeftCompt(XmlTags.C_Wei).rightRegionCompts();
        // 谓语辖域内最多有两个补语
        if (prrcs.filter((o) => o.belongIniType(XmlTags.C_Bu)).length >= 2)
          return;
      }

      let text = refCompt.textExtract(TextRegion.FRONT, true).trim();
      if (refCompt.belongIniType(XmlTags.C_CC)) {
        let type = refCompt.iniType;
        let newCol = refCompt.column;
        GridUtil.addColumn(pCompt, newCol);
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          newCol,
          type,
          null,
          '',
          null,
          TextType.VIRTUAL
        );
        GridUtil.addItem(WordFlag, pCompt, 3, newCol, type);

        pCompt.$nextTick(() => {
          pCompt.active();
          let newCompt = pCompt.childrenItems.find(
            (o) => o.column == newCol && o.belongType(TextCompt)
          );
          if (newCompt != null) {
            newCompt.textFill(text, TextRegion.FRONT);
          }
        });
      } else {
        let ppCompt = pCompt.parentCompt;
        let pCol = pCompt.column;
        let iniItems = GridUtil.iniGridComptItems(pCompt.iniType);
        GridUtil.addColumn(ppCompt, pCol);
        GridUtil.addItem(
          GridCompt,
          ppCompt,
          3,
          pCol,
          pCompt.iniType,
          null,
          '',
          iniItems
        );

        ppCompt.$nextTick(() => {
          let newCompt = ppCompt.childrenItems.find(
            (o) => o.column == pCol && o.belongType(GridCompt)
          );
          if (newCompt != undefined) {
            newCompt.active();
            newCompt.textFill(text, TextRegion.ALL);
          }
          // 对原焦点部分触发重置操作（依句辨品、处理标点等）
          resetComponent(pCompt, null, true);
        });
      }
    },
  };

  // 策略方法调用接口
  return {
    strategyFunction(
      method,
      refCompt,
      moveText,
      type,
      event,
      position,
      newXml
    ) {
      return (
        strategy[method] &&
        strategy[method](refCompt, moveText, type, event, position, newXml)
      );
    },
    // 添加算法
    addStrategy(method, fn) {
      strategy[method] = fn;
    },
  };
})();

/**
 * 从refCompt或当前焦点所在TextCompt成分中添加新成分
 * @param {String} method 调用的方法名
 * @param {VueComponent} refCompt 引用成分，为空时则查找当前焦点所在TextCompt
 * @param {String} type 类型：如APP或COO或UNI等
 * @param {Boolean} moveText 是否移动文字
 * @param {Event} event 鼠标点击或触屏事件
 * @param {Number} position 位置信息，如添加到首句
 * @param {String} newXml 新增成分的XML
 * @returns
 */
function addComponent(
  method,
  refCompt,
  type,
  moveText,
  event,
  position,
  newXml
) {
  let tcVue;
  if (refCompt == null) {
    let activeEle = document.activeElement;
    // if (activeEle.nodeName != "DIV" || !activeEle.getAttribute("contenteditable"))
    //   return;
    tcVue = activeEle.ancestor(TextCompt);
  } else tcVue = refCompt;
  // console.log(tcVue)

  if (tcVue == null || !tcVue.belongType(BaseCompt)) return;
  let editor = tcVue.getEditor();
  // if (editor != null) editor.record();
  if (moveText == undefined) moveText = true;
  // 策略模式调用对应方法
  let suc = builderStrategy.strategyFunction(
    method,
    tcVue,
    moveText,
    type,
    event,
    position,
    newXml
  );

  if (editor != null && suc) {
    editor.updateAcFloatInfo();

    if (method == 'extendStack' || method == 'addPrdLift') {
      tcVue.$nextTick(() => {
        if (tcVue._isDestroyed && editor.activeComponent != null) {
          // console.log(tcVue._isDestroyed)
          editor.activeComponent.isActive = false;
          editor.activeComponent = null;
        }
      });
    } else {
      tcVue.$nextTick(() => {
        if (editor.focusedWordUnit != null) {
          // 多等一个时延，需要等iniType更新完毕，后续应该改成await方式处理
          tcVue.$nextTick(() => {
            editor.focusedWordUnit.updateTypeBlock();
            editor.focusedWordUnit.querySentOrWord();
          });
        }
      });
    }
  }
}

/**
 * 删除成分
 * @param {VueComponent} compt
 * @param {Boolean} keepLeft 是否保留左边辖域成分
 * @param {Boolean} adjustLifter 是否调整顶起支架位置
 * @returns
 */
async function deleteComponent(compt, keepLeft, adjustLifter, event) {
  if (compt == null) return false;
  let pCompt = compt.parentCompt;
  if (pCompt == null || pCompt.items.length == 0) return false;
  if (adjustLifter == null) adjustLifter = true;

  // console.log(pCompt.iniType);
  // 约束：主谓宾顶起中复句主语，不能删除    20220628
  // if (compt.iniType == XmlTags.C_Zhu && !compt.isInBlock && pCompt.isInStack && !pCompt.isMainSent) return false;

  let col = compt.column;
  let compts = GridUtil.findElemsByCol(
    pCompt,
    1,
    GlobalConst.GridMaxCol,
    BaseCompt
  );
  let prds;
  let uniPos = GridUtil.posInUni(compt);

  if (compt.belongIniType(XmlTags.C_Zhu) && uniPos <= UniPos.ONLY) {
    // 约束：主谓谓语句主语，不能删除
    prds = compts.filter((o) => o.iniType == XmlTags.C_Wei);
    if (prds.length > 0 && prds[0].belongType(GridCompt, StackCompt))
      return false;
  }
  // 约束：非StackCompt中的独词句，不能删除
  let onlySbj = compt.isOnlySbj;
  if (
    onlySbj &&
    uniPos <= UniPos.ONLY &&
    !pCompt.isInStack &&
    (!compt.belongType(GridCompt) || !compt.isInStack)
  ) {
    return false;
  }

  //  约束：主干上宾语只有一个，不能删除
  if (compt.belongIniType(XmlTags.C_Bin) && pCompt.isMainSent) {
    let leftPrd = compt.nearestLeftCompt(XmlTags.C_Wei);
    let lc = leftPrd.column;
    let sc = lc - leftPrd.leftRegion(1);
    let ec = lc + leftPrd.rightRegion(1);
    let objs = compts.filter(
      (o) => o.column >= sc && o.column <= ec && o.iniType == XmlTags.C_Bin
    );
    if (objs.length == 1) return false;
  }

  // 约束：带顶起结构的独词句中的唯一NP成分不能删除
  let liftNps = [XmlTags.C_Ding, XmlTags.C_FF, XmlTags.C_PP, XmlTags.C_UN];
  if (compt.belongIniType(liftNps)) {
    let sbjs = compts.filter((o) => o.belongIniType(XmlTags.C_Zhu));
    if (
      sbjs.length > 0 &&
      sbjs.every((o) => o.isOnlySbj) &&
      sbjs.some((o) => !o.belongType(TextCompt)) &&
      compts.filter((o) => o.belongIniType(liftNps)).length == 1
    ) {
      return;
    }
  }

  if (prds == null) prds = compts.filter((o) => o.iniType == XmlTags.C_Wei);

  if (compt.belongIniType(XmlTags.C_Wei)) {
    let sbjs = compts.filter((o) => o.belongIniType(XmlTags.C_Zhu));
    // 约束：1)附加成分复句 2)顶起复句 3)带箭头对齐    只剩一个谓语，造成独词，不能删除
    if (
      sbjs.length >= 1 &&
      (!compt.isInMainLine || pCompt.endPlug == PlugType.Arrow1) &&
      prds.length == 1
    )
      return false;

    // 约束：后一个谓语带主语，会造成双主语情况，则不能删除
    let rightPrd = compt.nearestRightCompt(XmlTags.C_Wei);
    if (rightPrd != null && rightPrd.prdExtend() == PrdExtend.UNI) {
      let uniLeftSbj = rightPrd.nearestLeftCompt(XmlTags.C_Zhu);
      if (
        uniLeftSbj != null &&
        uniLeftSbj.column > compt.column &&
        compt.prdExtend() == PrdExtend.NORMAL
      )
        return false;
    }
  }

  // 助动只删除自己，不删除辖域成分
  if (compt.prdExtend() == PrdExtend.SYN) keepLeft = true;

  let start = keepLeft ? col : col - compt.leftRegion();
  let end = col + compt.rightRegion();

  // console.log(keepLeft);
  // console.log(col);
  // console.log(end + "-" + start);
  // 约束：联合结构的独词句中，带唯一NP的主语不能删除
  if (onlySbj && uniPos > UniPos.ONLY) {
    let nLen = compts.filter((o) => o.belongIniType(liftNps)).length;
    let snLen = compts.filter(
      (o) => o.column >= start && o.column <= end && o.belongIniType(liftNps)
    ).length;
    if (
      nLen - snLen == 0 &&
      compts.some(
        (o) =>
          o.belongIniType(XmlTags.C_Zhu) &&
          o != compt &&
          !o.belongType(TextCompt)
      )
    )
      return false;
  }

  if (compt.belongIniType(XmlTags.C_Wei)) {
    //  1. 变为独词句逻辑
    if (prds.length == 1 && compt.isInMainLine) {
      let lefts = compt.leftCompts();
      let objSeps = GridUtil.findElemsByCol(
        pCompt,
        1,
        GlobalConst.GridMaxCol,
        ObjSep
      );
      let objs = compts.filter((o) => o.belongIniType(XmlTags.C_Bin));
      // 1.1 非双宾，谓语前成分都为空，宾语非顶起，不包含补语或UV  宾语NP转独词
      if (
        objSeps.length == 1 &&
        objs.every((o) => o.belongType(TextCompt)) &&
        objs.some((o) => o.text != '') &&
        lefts.every((o) => o.toXml().textContent == '') &&
        compts.every(
          (o) =>
            !o.belongIniType(XmlTags.C_Bu) && !o.belongIniType(XmlTags.C_UV)
        )
      ) {
        start = 1;
        end = objSeps[0].column;
        objs.forEach((o) => o.updateParentItem('iniType', XmlTags.C_Zhu));
      }
      // 1.2 删除谓语VP  主语转独词
      else {
        let sbjSeps = GridUtil.findElemsByCol(
          pCompt,
          1,
          GlobalConst.GridMaxCol,
          SbjSep
        );
        // 约束：无主句时，不能删除谓语
        if (sbjSeps.length == 0) return false;

        let sepCol = sbjSeps.firstOrDefault().column;
        let befores = compts.filter((o) => o.column >= 1 && o.column <= sepCol);
        let advs = befores.filter((o) => o.belongIniType(XmlTags.C_Zhuang));
        // 约束：主语前有状语，不能删除谓语
        if (advs.length > 0) return false;

        let liftSbjs = befores.filter(
          (o) =>
            o.belongIniType(XmlTags.C_Zhu) &&
            o.belongType(GridCompt, StackCompt)
        );
        // 约束：顶起的主语不带liftNps时，不能删除谓语
        if (
          liftSbjs.length > 0 &&
          befores.every((o) => !o.belongIniType(liftNps))
        ) {
          return false;
        }

        start--;
        let lastCompt = pCompt.getChild(1, end + 1, TextCompt);
        // console.log(lastCompt)
        if (lastCompt != null && lastCompt.iniType == XmlTags.C_UV) end++;
      }
    }
    // 2. 多谓语情况
    else if (prds.length > 1) {
      // 2.1 删除第一个谓语或合成谓语，需要删除后面的PrdSep
      if (
        prds.firstOrDefault() == compt ||
        compt.prdExtend() == PrdExtend.SYN
      ) {
        end++;
      }
      // 2.2 其他情况
      else {
        start--;
        let startPrd = pCompt.getChild(1, start, PrdSep);
        // 合成谓语删除后一谓语时保留宾语并删除前面的状助
        if (startPrd != null && startPrd.prdType == XmlTags.V_Fun_SYN) {
          end = start + 1 + compt.leftRegion();
        } else {
          //  带主语的联合谓语句，将主语区域算入谓语左侧范围之内
          let leftSbj = compt.nearestLeftCompt(XmlTags.C_Zhu);
          let leftUniPrd = GridUtil.findElemsByCol(
            pCompt,
            1,
            col,
            PrdSep
          ).lastOrDefault((o) => o.prdType == XmlTags.V_Fun_UNI);
          let beforePrd = compt.nearestLeftCompt(XmlTags.C_Wei); //防止中间有其他复杂谓语
          if (
            leftSbj != null &&
            leftUniPrd != null &&
            leftUniPrd.column < leftSbj.column &&
            beforePrd.column < leftSbj.column
          ) {
            start = leftUniPrd.column;
          }
        }
      }
    }
  } else if (compt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin)) {
    let leftCC = false;
    let rightCC = false;

    let sFlag = pCompt.getChild(3, start - 1, WordFlag);
    if (sFlag != null && XmlTags.Np_Fun.contains(sFlag.iniType)) leftCC = true;

    let eFlag = pCompt.getChild(3, end + 1, WordFlag);
    if (eFlag != null && XmlTags.Np_Fun.contains(eFlag.iniType)) rightCC = true;

    // 并列或同位中的第一个核心成分
    if (!leftCC && rightCC) {
      end++;
      // 首个宾语，保留宾语分隔符
      if (compt.iniType == XmlTags.C_Bin && start != col) start++;
    }
    // 并列或同位中的非第一个核心成分
    else if (leftCC) {
      start--;
      // 末尾的主语，保留主语分隔符
      if (
        !rightCC &&
        compt.iniType == XmlTags.C_Zhu &&
        pCompt.getChild(1, end, SbjSep) != null
      )
        end--;
    }
  }
  // 状语前后有连词，需看情况是否删除
  else if (compt.belongIniType(XmlTags.C_Zhuang)) {
    let leftCompt = compt.nearestLeftCompt();
    let rightCompt = compt.nearestRightCompt();
    // 删除前边uni
    if (
      leftCompt &&
      leftCompt.belongIniType(XmlTags.V_Fun_UNI1) &&
      leftCompt.nearestLeftCompt() == null &&
      (rightCompt == null || !rightCompt.belongIniType(XmlTags.C_Zhuang))
    ) {
      start -= 1;
    }
    // 删除后边连词
    else if (
      leftCompt &&
      leftCompt.belongIniType(XmlTags.C_CC, XmlTags.V_Fun_UNI1) &&
      rightCompt &&
      rightCompt.belongIniType(XmlTags.C_CC, XmlTags.V_Fun_UNI1)
    ) {
      end += 1;
    }
  }

  // 删除无主句，取父级
  if (onlySbj && uniPos == UniPos.ONLY) {
    compt = compt.parentCompt;
    pCompt = compt.parentCompt;
  }

  let pText = pCompt.toXml().textContent;
  let gridText = compt.mainSentCompt.toXml().textContent;
  let mlrCompts = compt.mainLineCompt.rightCompts();
  let comptXml = compt.toXml().cloneNode(true);
  // let comptText = compt.toXml().textContent;
  let comptText = compt.textExtract(TextRegion.ALL, true).removeSpace();
  let isToSent = compt.isSentFirstCompt() || compt.isSentLastCompt(); // 句首或句末成分转小句
  if (isToSent) pText = pCompt.toXml().textContent;
  // 删除复式结构StackCompt中的成分
  if (pCompt.belongType(StackCompt)) {
    GridUtil.delRow(pCompt, compt.row);
    // 只剩一句时进行转化
    if (pCompt.items.length == 1) GridUtil.stack2Grid(pCompt, compt.row);
  }
  // 删除GridCompt中的成分
  else {
    //删除
    // if (keepLeft) start = col;
    // console.log(end + "-" + start);
    for (let i = end; i >= start; i--) GridUtil.delColumn(pCompt, i);

    //  ----删除后处理----
    await pCompt.$nextTick(() => {
      compts = GridUtil.findElemsByCol(
        pCompt,
        1,
        GlobalConst.GridMaxCol,
        BaseCompt
      );
      prds = compts.filter((o) => o.iniType == XmlTags.C_Wei);
      // 1.删除双宾语后，单宾语可以倒装
      if (prds.length == 1) {
        let prr = prds.firstOrDefault().rightRegion();
        let prdIdx = prds.firstOrDefault().column;
        let objSeps = GridUtil.findElemsByCol(
          pCompt,
          prdIdx,
          prdIdx + prr,
          ObjSep
        );

        if (objSeps.length == 1) objSeps.firstOrDefault().editable = true;
      }

      // 2.顶起的主语、谓语、宾语中只有一个成分：降下 或者 主谓谓语句中顶起成分带宾语
      if (
        pCompt.belongType(GridCompt) &&
        pCompt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin)
      ) {
        // 2.1 GridCompt -> TextCompt
        if (
          compts.length > 1 &&
          !compts.some((p) => p.iniType == XmlTags.C_Zhu) &&
          pCompt.iniType == XmlTags.C_Wei &&
          compt.iniType == XmlTags.C_Zhu
        ) {
          let pRow = pCompt.row;
          let pCol = pCompt.column;
          let ppCompt = pCompt.parentCompt;
          GridUtil.delColumn(ppCompt, pCol);
          GridUtil.addColumn(ppCompt, pCol);
          GridUtil.addItem(
            TextCompt,
            ppCompt,
            pRow,
            pCol,
            pCompt.iniType,
            null,
            pText.insertPuncSpace()
          );
          ppCompt.$nextTick(() => {
            let newCompt = ppCompt.childrenItems.find(
              (o) => o.column == pCol && o.row == pRow
            );
            if (newCompt != null) {
              newCompt.active();
              if (pCompt.iniType == XmlTags.C_Wei && pCompt.isInMainLine)
                addComponent('addObj', newCompt, null, false);
            }
          });
        }
        // 2.2 删除最后一个谓语
        else if (compts.length == 0) {
          deleteComponent(pCompt);
          return;
        }
        // 2.3 重新调整支架
        else if (adjustLifter) GridUtil.checkLifter(pCompt);
      }

      // 3.定、状、补、独
      else if (
        pCompt.belongType(GridCompt) &&
        pCompt.belongIniType(XmlTags.C_Sub)
      ) {
        let children = compts.filter(
          (o) => o.textType != TextType.VIRTUAL_CORNER
        );
        if (children.length == 0) {
          // 复句中单句
          if (pCompt.isInStack) {
            deleteComponent(pCompt);
            return;
          }

          GridUtil.delColumn(pCompt.parentCompt, pCompt.column);
        }
        // 剩余一个TextCompt成分和独立语时，置为Generic
        else if (
          children.some((o) => o.belongIniType(XmlTags.C_Ind)) &&
          children.filter((o) => !o.belongIniType(XmlTags.C_Ind)).length == 1
        ) {
          let tCompt = children.find((o) => o.belongType(TextCompt));
          if (tCompt && !pCompt.isInStack) updateChildrenType(pCompt);
        }
        // 只剩一个成分时
        else if (children.length == 1) {
          // 只剩一个TextCompt成分时，置为Generic
          if (children[0].belongType(TextCompt)) {
            if (!pCompt.isInStack) updateChildrenType(pCompt);
          }
          // GridCompt StackCompt
          else {
            let pCol = pCompt.column;
            let ppCompt = pCompt.parentCompt;
            GridUtil.delColumn(ppCompt, pCol);
            GridUtil.addColumn(ppCompt, pCol);
            let xml = pCompt.toXml().cloneNode(true);
            if (children[0].belongType(GridCompt))
              GridUtil.addItem(
                GridCompt,
                ppCompt,
                3,
                pCol,
                pCompt.iniType,
                xml
              );
            else if (children[0].belongType(StackCompt)) {
              xml = XmlParser.wrapXjNode(xml);
              GridUtil.addItem(
                StackCompt,
                ppCompt,
                3,
                pCol,
                pCompt.iniType,
                xml
              );
            }
            ppCompt.$nextTick(() => {
              let newCompt = ppCompt.childrenItems.find(
                (o) => o.column == pCol
              );
              if (newCompt != null) newCompt.fromXml();
            });
          }
        }
      }
    });
  }

  // 句首或句末成分（包含顶起复句中的小句）（按Ctrl/移动端）拖动，分别向上或向下切分小句
  let newGridText = compt.mainSentCompt.toXml().textContent;
  // 所在主干成分右边都为空成分时，也归为末尾
  if (!isToSent && mlrCompts.every((o) => o.toXml().textContent == ''))
    isToSent = true;
  // console.log(gridText);
  // console.log(newGridText);
  if (
    event != null &&
    comptText != '' &&
    (gridText == newGridText + comptText ||
      gridText == comptText + newGridText) &&
    (compt.isInMainLine || isToSent)
  ) {
    let firstPrd = compt.mainSentCompt.childrenItems.find((o) =>
      o.belongIniType(XmlTags.C_Wei)
    );
    if (firstPrd != null) {
      setTimeout(() => {
        // 单个GridCompt扩展时，pRow取1
        let pRow = firstPrd.mainSentCompt.row;
        if (pRow == null) pRow = 1;
        if (gridText == newGridText + comptText) pRow++;
        let gType = XmlParser.getComponentType(comptXml);
        // todo 完善拖动StackCompt时，转多个复句逻辑
        if (
          gType == StackCompt ||
          comptXml.element(XmlTags.C_Wei) == null ||
          comptXml.element(XmlTags.C_UU) != null
        )
          comptXml = XmlParser.getInitialSentXml(
            comptXml.textContent.insertPuncSpace()
          );

        addComponent(
          'extendStack',
          firstPrd,
          null,
          false,
          event,
          pRow,
          comptXml.replaceTagName(XmlTags.C_Sent)
        );
      }, 10);
    }
  }

  return true;
}

/**
 * 重置Editor当前标注的成分，收起前后辖域成分
 * @param {VueComponent} editor
 * @param {Boolean} resetWord 对于包含动态词的TextCompt，=true时先只合并动态词处理，不合并成分
 */
function resetEditorDiagram(editor, resetWord) {
  if (editor == null) return false;
  let tagTab = editor.tagTab;
  if (tagTab == null || tagTab.selectedTab == null) return false;

  editor.record();
  // console.log(tagTab);
  if (editor.diagramEditable) {
    let activeCompt = editor.activeComponent;
    let text = '';
    //无焦点或焦点为最外层句子    todo 段落标注时如何重置
    if (
      activeCompt == null ||
      activeCompt._isDestroyed ||
      activeCompt.parentCompt == null
    ) {
      //有焦点取焦点句子内容，无焦点则取原文
      if (activeCompt == null || activeCompt._isDestroyed) {
        text = editor.textInfo.text;
      } else {
        text = activeCompt.toXml().textContent;
      }

      let xml = XmlParser.getInitialXml(text.insertPuncSpace());
      editor.diagramVue.decodeXml(xml);
      return true;
    }

    return resetComponent(activeCompt, resetWord);
  }
  return false;
}

/**
 * 重置成分，收起compt前后辖域成分
 * @param {VueComponent} compt
 * @param {Boolean} resetWord 对于包含动态词的TextCompt，=true时先只合并动态词处理，不合并成分
 */
function resetComponent(compt, resetWord, keepUU = false) {
  if (compt == null) return false;

  if (resetWord == null) resetWord = true;
  // console.log(compt);
  let pCompt = compt.parentCompt;
  let text = compt.toXml().textContent;
  //焦点为复句中单句
  if (compt.isInStack) {
    let xml = XmlParser.getInitialXml(text.insertPuncSpace());
    let row = compt.row;
    let sentId = compt.sentId;
    GridUtil.delRow(pCompt, row);
    GridUtil.addRow(pCompt, row);
    GridUtil.addItem(
      GridCompt,
      pCompt,
      row,
      1,
      XmlTags.O_Sent,
      xml.firstElementChild
    );

    pCompt.$nextTick(() => {
      let newCompt = pCompt.childrenItems.find(
        (o) => o.row == row && o.column == 1 && o.belongType(GridCompt)
      );
      if (newCompt != null) newCompt.fromXml();
      // todo 改为para时是否需要修改
      if (sentId > 0) {
        newCompt.sentId = sentId;
      }
    });

    return true;
  }

  //焦点为TextCompt
  if (compt.belongType(TextCompt)) {
    //如果是动态词，则分两步，合并动态词，合并管辖成分
    if (!resetWord || compt.wordUnit.dynamicPos == '') {
      if (compt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin)) {
        var rrs = compt.rightRegionElems();
        if (rrs != null) {
          // console.log(rrs);
          rrs.forEach((rr) => {
            if (rr.belongType(BaseCompt)) {
              let rrText = rr.toXml().textContent;
              text += rrText;
            }
            GridUtil.delColumn(pCompt, compt.column + 1);
          });
        }

        var lrs = compt.leftRegionCompts();
        if (lrs != null) {
          lrs.reverse();
          // console.log(lrs);
          lrs.forEach((lr) => {
            let lrText = lr.toXml().textContent;
            text = lrText + text;
            GridUtil.delColumn(pCompt, lr.column);
          });
        }
      }

      // 主句谓语
      if (compt.iniType == XmlTags.C_Wei && compt.isInMainLine) {
        pCompt.$nextTick(() => {
          addComponent('addObj', compt, null, false);
        });
      }
    }

    if (pCompt != null && pCompt.belongIniType(XmlTags.C_Sub)) {
      pCompt.$nextTick(() => {
        if (pCompt.childrenItems.length == 2) updateChildrenType(pCompt);
      });
    }
    pCompt.$nextTick(() => {
      compt.wordUnit.oldText = text;
      compt.wordUnit.textFill(text.insertPuncSpace(), TextRegion.ALL);
      compt.wordUnit.onFocus();
    });

    return true;
  }

  // 整体选中 定状补独
  if (compt.belongIniType(XmlTags.C_Sub)) {
    let row = compt.row;
    let col = compt.column;
    let needMerge =
      compt.hasGeneric &&
      compt.cornerCompt != null &&
      compt.cornerCompt.text != '';
    if (keepUU) needMerge = false;
    GridUtil.delColumn(pCompt, col);
    GridUtil.addColumn(pCompt, col);
    GridUtil.addItem(
      GridCompt,
      pCompt,
      row,
      col,
      compt.iniType,
      null,
      '',
      GridUtil.iniGridComptItems(compt.iniType)
    );

    pCompt.$nextTick(() => {
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.row == row
      );
      if (newCompt != null) {
        newCompt.active();
        if (needMerge)
          newCompt.mergeTextFill(text.insertPuncSpace(), TextRegion.ALL);
        else newCompt.textFill(text.insertPuncSpace(), TextRegion.ALL);
      }
    });

    return true;
  }

  // 顶起的主谓宾
  if (
    compt.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin) &&
    !compt.isInStack
  ) {
    let row = compt.row;
    let col = compt.column;
    GridUtil.delColumn(pCompt, col);
    GridUtil.addColumn(pCompt, col);
    GridUtil.addItem(
      TextCompt,
      pCompt,
      row,
      col,
      compt.iniType,
      null,
      text.insertPuncSpace()
    );

    pCompt.$nextTick(() => {
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.row == row
      );
      if (newCompt != null) {
        pCompt.active();
        if (newCompt.iniType == XmlTags.C_Wei && newCompt.isInMainLine)
          addComponent('addObj', newCompt, null, false);
      }
    });
  }

  return true;
}

/**
 * 拖动合并成分
 * @param {BaseCompt} refer 拖动成分
 * @param {BaseCompt} target 目标成分
 * @param {Number} tarRow
 * @param {Number} tarCol
 * @returns
 */
async function mergeComponent(refer, target, tarRow, tarCol) {
  if (refer == null || refer.parentCompt == null) return;

  // 限制：不能向联合结构中的连词位拖动
  // if (target != null && target.belongIniType(XmlTags.V_Fun_APP, XmlTags.V_Fun_COO, XmlTags.V_Fun_UNI)) return;

  let editor = refer.getEditor();
  if (editor != null) editor.record();

  if (target != null) {
    tarRow = target.row;
    tarCol = target.column;
  }
  // console.log(refer);
  // console.log(target);

  let pCompt = refer.parentCompt;
  let row = refer.row;
  let col = refer.column;
  // let text = refer.toXml().textContent;

  let count = refer.isInStack
    ? pCompt.gridCompts().length
    : pCompt.childrenItems.length;
  let compts = [];
  let textRegion;
  let isLow2High; //拖动成分从上到下或从左到右
  let start;
  let end;
  if (refer.isInStack) {
    isLow2High = tarRow > row;
    start = isLow2High ? row : tarRow + 1;
    end = isLow2High ? tarRow - 1 : row;
    textRegion = isLow2High ? TextRegion.FRONT : TextRegion.BEHIND;
    compts = GridUtil.findElemsByRow(pCompt, start, end, BaseCompt).filter(
      (o) => o.textType != TextType.VIRTUAL_CORNER
    );
  } else {
    isLow2High = tarCol > col;
    start = isLow2High ? col : tarCol + 1;
    end = isLow2High ? tarCol - 1 : col;
    textRegion = isLow2High ? TextRegion.FRONT : TextRegion.BEHIND;
    compts = GridUtil.findElemsByCol(pCompt, start, end);
  }

  let noSbj = false; //是否无主句
  if (refer.isInMainLine) {
    let firstPrd = pCompt.childrenItems
      .sort((a, b) => a.column - b.column)
      .firstOrDefault((o) => o.belongIniType(XmlTags.C_Wei));
    if (firstPrd != null) {
      noSbj = firstPrd.nearestLeftCompt(XmlTags.C_Zhu) == null;
    }
  }
  let length = compts.length;
  let text = '';
  let leftNpUni;
  // 单句内成分拖动合并
  if (!refer.isInStack) {
    if (isLow2High) {
      let referLeft = refer.nearestLeftCompt();
      // 从左到右删除时，需要保留左边被删联合连词框内文字
      if (referLeft != null && referLeft.belongIniType(XmlTags.Np_Fun))
        leftNpUni = referLeft;
    }
    compts.forEach((o) => {
      if (o.belongType(BaseCompt)) {
        text += o.toXml().textContent;
        o.textExtract(TextRegion.ALL, true);
      }
    });
  }
  // 复句拖动合并
  else {
    for (let i = 0; i < compts.length; i++) {
      const c = compts[i];
      if (c.belongType(BaseCompt)) {
        text += c.toXml().textContent;
        await deleteComponent(c, true);
      }
    }
  }

  await new Promise((resolve, reject) => {
    setTimeout(() => {
      // console.log(text);
      // 1.Stack->Grid
      if (refer.isInStack && count - length == 1) {
        // 1.1最外层主句Stack->Grid
        if (pCompt.isMainSent) {
          let diagramCompt = editor.diagramVue.compt;
          mergeToGridCompt(diagramCompt, text, textRegion);
        }
        // 1.2附加成分中Stack->Grid
        else {
          let newGrid = pCompt.parentCompt.childrenItems.find(
            (o) => o.column == pCompt.column && o.row == pCompt.row
          );
          if (newGrid != null) mergeToGridCompt(newGrid, text, textRegion);
        }
      }
      // 2.小句合并
      else if (target.belongType(GridCompt) && target.isInStack)
        mergeToGridCompt(target, text, textRegion);
      // 3.其他情况（独词句情况后处理）
      else if (
        !(
          target.isInMainLine &&
          target.belongIniType(XmlTags.C_Zhu) &&
          refer.belongIniType(XmlTags.C_Wei, XmlTags.C_Bin)
        )
      ) {
        target.mergeTextFill(text, textRegion);
      }

      // 单句内删除多余成分
      if (!refer.isInStack) {
        // console.log(121);
        // deleteComponent有延时，采用定时器方式
        let int = setInterval(() => {
          let item = pCompt.childrenItems.find(
            (o) => o.column == end && o.belongType(BaseCompt)
          );
          // 判断下列成份是否需要删除： 非联合连词成份 或 联合谓语且右边为空（需删除）
          if (
            compts.contains(item) &&
            (!item.belongIniType(
              XmlTags.V_Fun_UNI,
              XmlTags.V_Fun_APP,
              XmlTags.V_Fun_COO
            ) ||
              (item.nearestRightCompt() == null &&
                item.belongIniType(XmlTags.V_Fun_UNI))) &&
            !(
              (item.nearestRightCompt() == target ||
                item.nearestLeftCompt() == target) &&
              target.belongIniType(
                XmlTags.V_Fun_APP,
                XmlTags.V_Fun_COO,
                XmlTags.V_Fun_UNI
              )
            )
          ) {
            // 谓语左边不是合成分隔符 或者 辖域内有非空成分  则保留
            let leftElem = item.nearestLeftElem();
            if (
              (leftElem != null &&
                leftElem.belongType(PrdSep) &&
                leftElem.prdType == XmlTags.V_Fun_SYN) ||
              item.prdExtend() == PrdExtend.SYN ||
              isRegionEmpty(item)
            ) {
              let delFn = deleteComponent(item, false, false);
              delFn.then((suc) => {
                // 主干线顶起宾语需要下沉
                if (
                  !suc &&
                  item.isInMainLine &&
                  item.belongIniType(XmlTags.C_Bin) &&
                  !item.belongType(TextCompt)
                ) {
                  item.$nextTick(() => {
                    resetComponent(item);
                  });
                }
              });
            }
          }
          end--;

          if (end < start) {
            clearInterval(int);

            // 删除完后续处理
            pCompt.$nextTick(() => {
              // 顶起主、谓、宾内调整支架
              if (
                pCompt.belongIniType(
                  XmlTags.C_Zhu,
                  XmlTags.C_Wei,
                  XmlTags.C_Bin
                )
              )
                GridUtil.checkLifter(pCompt);

              // 从左到右删除时，需要保留左边被删联合连词框内文字
              if (
                leftNpUni != null &&
                pCompt.childrenItems.every((o) => o != leftNpUni)
              ) {
                target.mergeTextFill(leftNpUni.text, TextRegion.FRONT);
              }

              let prds = pCompt.childrenItems.filter(
                (o) => o.belongType(TextCompt) && o.belongIniType(XmlTags.C_Wei)
              );
              if (target.isInMainLine) {
                // 主干线补充空宾语
                prds.forEach((prd) => {
                  if (prd.prdExtend() != PrdExtend.SYN) {
                    let prdRRCs = prd.rightRegionCompts();
                    if (prdRRCs.every((o) => o.iniType != XmlTags.C_Bin)) {
                      addComponent('addObj', prd, null, false);
                    }
                  }
                });

                // 主干线补充空主语
                if (!noSbj) {
                  let firstPrd = prds.firstOrDefault();
                  if (
                    firstPrd != null &&
                    firstPrd.nearestLeftCompt(XmlTags.C_Zhu) == null
                  ) {
                    let sCol = isLow2High ? start : end;
                    GridUtil.addColumn(pCompt, sCol);
                    GridUtil.addItem(SbjSep, pCompt, 1, sCol);
                    GridUtil.addColumn(pCompt, sCol);
                    GridUtil.addItem(TextCompt, pCompt, 1, sCol, XmlTags.C_Zhu);

                    pCompt.$nextTick(() => {
                      pCompt.active();
                    });
                  }
                }

                // 独词句处理，触发义项
                if (
                  target.belongIniType(XmlTags.C_Zhu) &&
                  refer.belongIniType(XmlTags.C_Wei, XmlTags.C_Bin)
                ) {
                  target.mergeTextFill(text, textRegion);
                }
              }

              // 删除左边紧挨助动词的空谓语
              let emptyPrd = prds.firstOrDefault((o) => o.text == '');
              if (emptyPrd != null) {
                let leftElem = emptyPrd.nearestLeftElem();
                if (
                  leftElem != null &&
                  leftElem.belongType(PrdSep) &&
                  leftElem.prdType == XmlTags.V_Fun_SYN
                )
                  deleteComponent(emptyPrd);
              }

              target.$nextTick(() => {
                // 处理uu，需放到最后处理，否则会有问题
                // 目标为附属成分时，且内部为Generic，右向左拖动时进行重置操作
                // 左向右时，不会影响UU，右向左时，需要进行重置还原UU的位置
                if (target.belongIniType(XmlTags.C_Sub) && target.hasGeneric)
                  resetComponent(target, null, true);
                else if (target.belongType(TextCompt)) {
                  target.wordUnit.onFocus(null, true);
                  target.isDragActived = false;
                }
              });

              if (editor != null) editor.unFocus();
              resolve();
            });
          }
        }, 1);
      } else {
        resolve();
      }
    }, length + 1);
  });
}

function changeComponent(refer, tarRow, tarCol) {
  if (refer == null || refer.parentCompt == null) return false;

  // 限制：主、谓、宾、定、状
  if (
    !refer.belongIniType(
      XmlTags.C_Zhu,
      XmlTags.C_Wei,
      XmlTags.C_Bin,
      XmlTags.C_Ding,
      XmlTags.C_Zhuang,
      XmlTags.C_CC,
      XmlTags.V_Fun_UNI1
    )
  )
    return false;

  // 限制：非顶起主、谓、宾
  if (
    refer.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei, XmlTags.C_Bin) &&
    !refer.belongType(TextCompt)
  )
    return false;

  let row = refer.row;
  if (Math.abs(row - tarRow) != 2) return false;

  let editor = refer.getEditor();
  if (editor != null) editor.record();

  let pCompt = refer.parentCompt;
  let col = refer.column;
  let xml;

  // C1 定语转并列或同位
  if (refer.belongIniType(XmlTags.C_Ding)) {
    let rights = refer.rightCompts();
    // 判断OBJ或SBJ
    let belongNp = rights.firstOrDefault((o) =>
      o.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin)
    );

    let rightCompt = rights.firstOrDefault();
    xml = XmlParser.generateXml4Copy(refer);
    let last = xml.lastElementChild;
    // 1.1 带UU则合并文本
    if (last.tagName == XmlTags.C_UU) {
      GridUtil.delColumn(pCompt, col);
      GridUtil.addColumn(pCompt, col);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        1,
        col,
        belongNp.iniType,
        null,
        xml.textContent
      );
    }
    // 1.2 其他情况走粘贴逻辑（VP需顶起）
    else {
      xml = XmlParser.convert2Parse(xml, belongNp.iniType).replaceTagName(
        belongNp.iniType
      );
      col = XmlParser.parseXml2Compt(refer, belongNp.iniType, xml);
    }

    let ccType = XmlTags.V_Fun_COO;

    // 同位判断，后续为数量结构或某些特定词语
    let appWords = ['这些', '那些', '本人', '本身', '自己', '这个', '那个'];
    let rightText = rightCompt.toXml().textContent;
    let isApp = false; //数量结构或单个代词
    if (rightCompt.belongType(TextCompt)) {
      let pos = rightCompt.wordUnit.typeBlocks.map((o) => o.pos).join('');
      isApp = pos == 'mq' || pos == 'r';
    } else if (rightCompt.iniType == XmlTags.C_Ding) {
      let cItems = rightCompt.childrenItems;
      if (cItems.length == 2 && cItems[0].belongType(TextCompt)) {
        let pos = cItems[0].wordUnit.typeBlocks.map((o) => o.pos).join('');
        isApp = pos == 'mqr';
      }
    }

    if (appWords.contains(rightText) || isApp) ccType = XmlTags.V_Fun_APP;

    // 添加连接成分连词
    let cCol = col + 1;
    let ccText = '';
    if (rightCompt.belongIniType(XmlTags.V_Fun_COO1)) {
      ccText = rightCompt.textExtract(TextRegion.ALL);
      GridUtil.delColumn(pCompt, cCol);
    }
    GridUtil.addColumn(pCompt, cCol);
    GridUtil.addItem(WordFlag, pCompt, 3, cCol, ccType);
    GridUtil.addItem(
      TextCompt,
      pCompt,
      1,
      cCol,
      ccType,
      null,
      ccText,
      null,
      TextType.VIRTUAL
    );

    pCompt.$nextTick(() => {
      pCompt.active();
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.belongType(TextCompt)
      );
      if (newCompt != null) {
        newCompt.$nextTick(() => {
          // 转成分后，词性也需要转换
          newCompt.wordUnit.updateTypeBlock();
        });
      }
    });
  }
  // C2 状语转连词/合成/联合
  else if (refer.belongIniType(XmlTags.C_Zhuang)) {
    let items = refer.childrenItems;
    // 复句或包含主语则禁止向上拖动
    if (
      refer.belongType(StackCompt) ||
      items.some((o) => o.iniType == XmlTags.C_Zhu)
    )
      return false;

    let rights = refer.rightCompts();
    // 右边最近的所属成分（主语或谓语）
    let belongCompt = rights.firstOrDefault((o) =>
      o.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei)
    );
    if (belongCompt == null) return false;

    // 限制：归属主语且左边不能为连词
    let leftCompt = refer.nearestLeftCompt();
    if (
      leftCompt &&
      (leftCompt.belongIniType(XmlTags.V_Fun_UNI1) ||
        (leftCompt.belongIniType(XmlTags.C_CC) &&
          belongCompt.belongIniType(XmlTags.C_Zhu)))
    )
      return false;

    // 向上拖动限制：右边为连词时禁止
    let rightCompt = rights.firstOrDefault();
    if (
      rightCompt == null ||
      rightCompt.belongIniType(XmlTags.C_CC, XmlTags.V_Fun_UNI1)
    )
      return false;

    xml = XmlParser.generateXml4Copy(refer);
    // 2.1 主语前状语转连词
    if (belongCompt.belongIniType(XmlTags.C_Zhu)) {
      GridUtil.delColumn(pCompt, col);
      GridUtil.addColumn(pCompt, col);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        1,
        col,
        XmlTags.C_CC,
        null,
        '',
        null,
        TextType.VIRTUAL
      );
      GridUtil.addItem(WordFlag, pCompt, 3, col, XmlTags.C_CC);
      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == col && o.belongType(TextCompt)
        );
        if (newCompt != null) {
          newCompt.textFill(xml.textContent, TextRegion.ALL);
        }
      });
    }
    // 2.2 状语转合成或联合
    else {
      let last = xml.lastElementChild;
      let ccType = XmlTags.V_Fun_SYN;
      var lastPrdEl = xml.elements(XmlTags.C_Wei).lastOrDefault();

      // 2.2.1 NP、带UU则TextFill
      if (
        last.tagName == XmlTags.C_UU ||
        last.tagName.length == 1 ||
        lastPrdEl == null ||
        xml
          .elements()
          .some((o) =>
            [XmlTags.C_FF, XmlTags.C_UN, XmlTags.C_PP].contains(o.tagName)
          )
      ) {
        GridUtil.delColumn(pCompt, col);
        GridUtil.addColumn(pCompt, col);
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          col,
          XmlTags.C_Wei,
          null,
          xml.textContent.insertPuncSpace()
        );
      }
      // 2.2.2 其他走复制粘贴逻辑
      else {
        // 末尾谓语带宾语转联合
        if (lastPrdEl.elementsAfterSelf(XmlTags.C_Bin).length > 0)
          ccType = XmlTags.V_Fun_UNI;

        col = XmlParser.parseXml2Compt(refer, XmlTags.C_Wei, xml);
      }

      // 添加连接成分连词
      let cCol = col + 1;
      GridUtil.addColumn(pCompt, cCol);
      GridUtil.addItem(PrdSep, pCompt, 1, cCol, ccType);
      if (ccType == XmlTags.V_Fun_UNI)
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          cCol,
          XmlTags.V_Fun_UNI,
          null,
          '',
          null,
          TextType.VIRTUAL
        );
    }

    pCompt.$nextTick(() => {
      pCompt.active();
    });
  }
  // C3 主、宾转定语
  else if (refer.belongIniType(XmlTags.C_Zhu, XmlTags.C_Bin)) {
    let rights = refer.rightCompts();
    let rightCompt = rights.firstOrDefault();
    // 限制：需为同位或并列连词前的主、宾
    if (
      rightCompt == null ||
      !rightCompt.belongIniType(XmlTags.V_Fun_COO, XmlTags.V_Fun_APP)
    )
      return false;

    let text = refer.toXml().textContent;
    addComponent('addAtt', refer);

    GridUtil.delColumn(pCompt, col + 1); //删除旧核心
    GridUtil.delColumn(pCompt, col + 1); //删除连词位

    let rrc = rightCompt.nearestRightCompt();
    let rcText = rightCompt.toXml().textContent;
    // 3.1 转定语间连词
    if (rrc.belongIniType(XmlTags.C_Ding)) {
      GridUtil.addColumn(pCompt, col + 1);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        3,
        col + 1,
        XmlTags.V_Fun_COO1,
        null,
        rcText,
        null,
        TextType.VIRTUAL
      );
      GridUtil.addItem(WordFlag, pCompt, 3, col + 1, XmlTags.V_Fun_COO1);
    }
    // 3.2 合并到定语中
    else {
      text += rcText;
    }

    pCompt.$nextTick(() => {
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.belongType(GridCompt)
      );
      if (newCompt != null) {
        newCompt.textFill(text, TextRegion.ALL);
      }
      let vCompt = pCompt.childrenItems.find(
        (o) => o.column == col + 1 && o.belongType(TextCompt)
      );
      if (vCompt != null) {
        vCompt.active();
      }
    });
  }
  // C4 谓语或带右边辖域的VP转状语
  else if (refer.belongIniType(XmlTags.C_Wei)) {
    let rights = refer.rightElems();
    let rightPrd = rights.firstOrDefault((o) => o.belongType(PrdSep));
    if (rightPrd == null) return false;

    // 限制：后边联合谓语带主语，则不能转换
    if (rightPrd.belongIniType(XmlTags.V_Fun_UNI)) {
      let prdCompt = rights.firstOrDefault(
        (o) => o.column > rightPrd.column && o.belongIniType(XmlTags.C_Wei)
      );
      if (
        prdCompt != null &&
        rights.some(
          (o) =>
            o.column > rightPrd.column &&
            o.column < prdCompt.column &&
            o.belongIniType(XmlTags.C_Zhu)
        )
      )
        return false;
    }

    xml = XmlParser.generateXml4Copy(refer, 2);
    let text = xml.textContent;
    addComponent('addAdv', refer);

    if (rightPrd.prdType != XmlTags.V_Fun_SYN) {
      //移除空宾语
      let emptyObjs = xml.elements(XmlTags.C_Bin).filter((o) => o.isEmptyX());
      emptyObjs.forEach((o) => o.remove());
      // 4.1 多个成分走粘贴逻辑
      if (xml.childElementCount > 1) {
        // console.log(xml.cloneNode(true));
        xml = XmlParser.convert2Parse(xml, XmlTags.C_Zhuang, true);
        col = XmlParser.parseXml2Compt(
          refer,
          XmlTags.C_Zhuang,
          xml,
          true,
          0,
          1
        );
      }
      // 4.2 只有一个成分走填充逻辑
      else {
        pCompt.$nextTick(() => {
          let newCompt = pCompt.childrenItems.find(
            (o) => o.column == col && o.belongType(GridCompt)
          );
          if (newCompt != null) {
            newCompt.textFill(text, TextRegion.ALL);
          }
        });
      }
    }

    let count = rightPrd.column - col + 1;
    for (let i = 0; i < count; i++) GridUtil.delColumn(pCompt, col + 1); //删除多余成分

    // 联合谓语连词位有内容则转为句中连词
    if (rightPrd.prdType == XmlTags.V_Fun_UNI) {
      let tc = rights.find(
        (o) => o.column == rightPrd.column && o.belongType(TextCompt)
      );
      if (tc != null && tc.text != '') {
        GridUtil.addColumn(pCompt, col + 1);
        GridUtil.addItem(
          TextCompt,
          pCompt,
          1,
          col + 1,
          XmlTags.C_CC,
          null,
          tc.text,
          null,
          TextType.VIRTUAL
        );
        GridUtil.addItem(WordFlag, pCompt, 3, col + 1, XmlTags.C_CC);
      }
    }

    pCompt.$nextTick(() => {
      pCompt.active();
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.belongType(GridCompt)
      );
      if (rightPrd.prdType == XmlTags.V_Fun_SYN && newCompt != null) {
        newCompt.textFill(text, TextRegion.ALL);
      }
    });
  }
  // C5 主、谓前连词转uni或状语
  else if (refer.belongIniType(XmlTags.C_CC)) {
    let rights = refer.rightCompts();
    // 右边最近的所属成分（主语或谓语）
    let belongCompt = rights.firstOrDefault((o) =>
      o.belongIniType(XmlTags.C_Zhu, XmlTags.C_Wei)
    );
    if (belongCompt == null) return false;

    xml = XmlParser.generateXml4Copy(refer);
    let nearLeft = refer.nearestLeftCompt();
    let nearRight = refer.nearestRightCompt();
    // 5.1 左右为状语转uni
    if (
      (nearLeft && nearLeft.belongIniType(XmlTags.C_Zhuang)) ||
      (nearRight && nearRight.belongIniType(XmlTags.C_Zhuang))
    ) {
      GridUtil.delColumn(pCompt, col);
      GridUtil.addColumn(pCompt, col);
      GridUtil.addItem(
        TextCompt,
        pCompt,
        3,
        col,
        XmlTags.V_Fun_UNI1,
        null,
        '',
        null,
        TextType.VIRTUAL
      );
      GridUtil.addItem(WordFlag, pCompt, 3, col, XmlTags.V_Fun_UNI1);
      pCompt.$nextTick(() => {
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == col && o.belongType(TextCompt)
        );
        if (newCompt != null) {
          newCompt.active();
          newCompt.textFill(xml.textContent, TextRegion.ALL);
        }
      });
    }
    // 5.2 转状语
    else {
      GridUtil.delColumn(pCompt, col);
      addComponent('addAdv', belongCompt, null, false, null, col);
      pCompt.$nextTick(() => {
        pCompt.active();
        let newCompt = pCompt.childrenItems.find(
          (o) => o.column == col && o.belongType(GridCompt)
        );
        if (newCompt != null) {
          newCompt.textFill(xml.textContent, TextRegion.ALL);
        }
      });
    }
  }
  // C6 uni转连词
  else if (refer.belongIniType(XmlTags.V_Fun_UNI1)) {
    xml = XmlParser.generateXml4Copy(refer);

    GridUtil.delColumn(pCompt, col);
    GridUtil.addColumn(pCompt, col);
    GridUtil.addItem(
      TextCompt,
      pCompt,
      1,
      col,
      XmlTags.C_CC,
      null,
      '',
      null,
      TextType.VIRTUAL
    );
    GridUtil.addItem(WordFlag, pCompt, 3, col, XmlTags.C_CC);
    pCompt.$nextTick(() => {
      let newCompt = pCompt.childrenItems.find(
        (o) => o.column == col && o.belongType(TextCompt)
      );
      if (newCompt != null) {
        newCompt.active();
        newCompt.textFill(xml.textContent, TextRegion.ALL);
      }
    });
  }
  if (editor != null) editor.clearActiveCompt();

  return true;
}

/**
 * 根据联合或并列规则，更新定、状、补、独GridCompt里面成分的类型
 * @param {GridCompt} compt
 * @returns
 */
function updateChildrenType(compt) {
  // console.log("updateChildrenType");
  if (
    compt == null ||
    compt.items == null ||
    compt.items.length == 0 ||
    !compt.belongIniType(XmlTags.C_Sub)
  )
    return;

  let pCompt = compt.parentCompt;
  if (pCompt == null) return;

  let children = compt.childrenItems;
  let sbj = children.find((o) => o.belongIniType(XmlTags.C_Zhu));
  // 拖动合并后只剩一个主语
  if (children.length == 2 && sbj != null) {
    sbj.updateParentItem('iniType', XmlTags.O_Temp);
  }
  // 其他情况
  else if (sbj == null) {
    let items = compt.items;
    let temps = children.filter((o) =>
      o.belongIniType(XmlTags.C_Wei, XmlTags.C_Bin, XmlTags.O_Temp)
    );
    // 谓宾不能同时存在
    if (
      temps.length > 0 &&
      (temps.every((o) => !o.belongIniType(XmlTags.C_Wei)) ||
        temps.every((o) => !o.belongIniType(XmlTags.C_Bin)))
    ) {
      let vpTypes = [
        XmlTags.C_Zhuang,
        XmlTags.C_CC,
        XmlTags.C_Bu,
        XmlTags.C_UV,
      ].concat(XmlTags.Prd_Fun);
      let npTypes = [
        XmlTags.C_Ding,
        XmlTags.C_FF,
        XmlTags.C_PP,
        XmlTags.C_UN,
        XmlTags.V_Fun_COO,
        XmlTags.V_Fun_APP,
      ];
      let type;
      // 1.需要修改成谓语及联合
      if (items.some((o) => vpTypes.contains(o.iniType))) {
        type = XmlTags.C_Wei;
        // let ccTc = children.filter(o => o.belongIniType(XmlTags.Np_Fun));
        // ccTc.forEach(o => {
        //   if (o.belongType(TextCompt)) {
        //     o.updateParentItem("iniType", XmlTags.V_Fun_UNI);
        //     o.$forceUpdate();
        //   } else {
        //     let idx = items.findIndex(p => p.column == o.column && p.component.name == WordFlag.name);
        //     if (idx > -1) {
        //       items.splice(idx, 1);
        //       items.push({
        //         key: GridUtil.generateKey(),
        //         component: PrdSep,
        //         row: 1,
        //         column: o.column,
        //         iniType: XmlTags.V_Fun_UNI,
        //       });
        //     }
        //   }
        // });
      }
      // 2.需要修改成并列
      else {
        // let ccTc = children.filter(o => o.belongIniType(XmlTags.V_Fun_UNI));
        // ccTc.forEach(o => {
        //   if (o.belongType(TextCompt)) {
        //     o.updateParentItem("iniType", XmlTags.V_Fun_COO);
        //     o.$forceUpdate();
        //   } else {
        //     let idx = items.findIndex(p => p.column == o.column && p.component.name == PrdSep.name);
        //     if (idx > -1) {
        //       items.splice(idx, 1);
        //       items.push({
        //         key: GridUtil.generateKey(),
        //         component: WordFlag,
        //         row: 3,
        //         column: o.column,
        //         iniType: XmlTags.V_Fun_COO,
        //       });
        //     }
        //   }
        // });

        // 2.1修改为宾语
        if (items.some((o) => npTypes.contains(o.iniType)))
          type = XmlTags.C_Bin;
        // 2.2Generic
        else type = XmlTags.O_Temp;
      }

      temps.forEach((o) => o.updateParentItem('iniType', type));
    }
  }
}

/**
 * 判断compt左右辖域内成分是否为空
 * @param {VueComponent} compt
 * @returns Boolean
 */
function isRegionEmpty(compt) {
  // 所属谓语右边辖域成分不为空则保留
  let lpRRCs = compt.rightRegionCompts();
  if (
    lpRRCs.some((o) => o.belongType(BaseCompt) && o.toXml().textContent != '')
  ) {
    return false;
  }

  // 所属谓语左边辖域成分不为空则保留
  let lpLRCs = compt.leftRegionCompts();
  if (
    lpLRCs.some((o) => o.belongType(BaseCompt) && o.toXml().textContent != '')
  ) {
    return false;
  }
  return true;
}

/**
 * 小句合并中，向GridCompt合并文本
 * @param {VueComponent} compt
 * @param {String} text
 * @param {TextRegion} textRegion
 */
function mergeToGridCompt(compt, text, textRegion) {
  let sents = null;
  if (textRegion == TextRegion.FRONT) {
    let firstSbj = compt.childrenItems.firstOrDefault((o) =>
      o.belongIniType(XmlTags.C_Zhu)
    );
    // 非空主语或者非句子第一个成分时，添加状语
    if (
      firstSbj != null &&
      (firstSbj != compt.childrenItems.firstOrDefault() ||
        firstSbj.toXml().textContent != '')
    ) {
      // 有逗号时，切分多个状语
      let reg = new RegExp('(?<=，[’”）]|，(?![’”）]))', 'g');
      sents = text.split(reg);
      for (let i = 0; i < sents.length; i++) {
        addComponent(
          'addAdv',
          firstSbj,
          '',
          false,
          null,
          GlobalConst.DefaultStartCol
        );
      }
      compt.$nextTick(() => {
        for (let i = 0; i < sents.length; i++) {
          let newCompt = compt.childrenItems.find(
            (o) =>
              o.column == i + GlobalConst.DefaultStartCol &&
              o.belongType(GridCompt)
          );
          if (newCompt != null) {
            newCompt.active();
            newCompt.textFill(sents[i], textRegion);
          }
        }
      });
    }
  }

  let target = textRegion == TextRegion.BEHIND ? -1 : 0;
  if (sents == null) {
    compt.$nextTick(() => {
      compt.mergeTextFill(text, textRegion, target);
    });
  }
}

function traverseType(compt, type, items) {
  if (compt.belongType(type)) items.push(compt);

  compt.$children
    .slice(0)
    .sort((a, b) => a.column - b.column)
    .forEach((o) => {
      traverseType(o, type, items);
    });
}

import XmlParser from './xml_parser.js';
import GridUtil from './grid_util';
import GlobalConst from '../enum/global_variable.js';
import PrdExtend from '../enum/prd_extend.js';
import TextType from '../enum/text_type';
import TextRegion from '../enum/text_region.js';
import UniPos from '../enum/uni_pos';
import PlugType from '../enum/plug_type';
import XmlTags from './xml_tags.js';

import Diagram from '../components/Diagram';
import BaseCompt from '../components/BaseCompt';
import TextCompt from '../components/TextCompt';
import GridCompt from '../components/GridCompt';
import StackCompt from '../components/StackCompt';

import FillLifter from '../components/assist/FillLifter';
import SbjSep from '../components/assist/SbjSep';
import PrdSep from '../components/assist/PrdSep';
import ObjSep from '../components/assist/ObjSep';
import WordFlag from '../components/assist/WordFlag';

export default {
  addComponent,
  deleteComponent,
  resetComponent,
  resetEditorDiagram,
  mergeComponent,
  changeComponent,
  updateChildrenType,

  traverseType,
};
