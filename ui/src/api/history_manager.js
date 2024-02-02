export default function HistoryManager(diagram) {
  //#region 私有变量
  this._diagram = diagram; //当前操作图形
  this._actionDict = {}; //标注者及其对应的操作数据
  //#endregion

  //#region 公共变量
  // canRedo = false;
  // canUndo = false;
  //#endregion

  // static fun1() {
  //   //定义静态函数fun1
  // }

  //#region 私有方法
  this._getData = function () {
    let data = '';
    if (this._diagram != null) data = this._diagram.encodeXml().toPlainString();

    // console.log(data);
    return data;
  };
  this._setData = function (data) {
    if (this._diagram == null || data == null) return;

    let xml = new DOMParser().parseFromString(data, 'text/xml');
    if (xml.getElementsByTagName('parsererror').length == 0)
      this._diagram.historyDecodeXml(xml.firstElementChild);
  };

  this._isEqual = function (str1, str2) {
    if (str1 == null || str2 == null) return str1 == str2;

    return str1 == str2;
  };

  this._getAction = function () {
    if (this._diagram == null || this._diagram.tagger == null) return null;
    let tagger = this._diagram.tagger;

    if (!this._actionDict.hasOwnProperty(tagger)) {
      this._actionDict[tagger] = {
        actionIdx: -1,
        actionList: [],
        canRedo: false,
        canUndo: false,
      };
    }
    return this._actionDict[tagger];
  };
  //#endregion

  this.undo = function () {
    let action = this._getAction();
    let actionList = action.actionList;

    if (action.actionIdx == actionList.length)
      action.actionIdx = actionList.length - 1;

    //返回前，记录最新状态
    if (action.actionIdx == actionList.length - 1) {
      this.record();
    }

    if (action.actionIdx > 0 && actionList.length > 0) {
      action.actionIdx--;
      let data = actionList[action.actionIdx];
      this._setData(data);
      this.stateCheck();
    }

    // console.log("undo" + action.actionIdx);
  };

  this.redo = function () {
    let action = this._getAction();
    let actionList = action.actionList;

    if (action.actionIdx == -1) action.actionIdx = 0;

    if (action.actionIdx < actionList.length - 1 && actionList.length > 0) {
      action.actionIdx++;
      let data = actionList[action.actionIdx];
      this._setData(data);
      this.stateCheck();
    }

    // console.log("redo" + action.actionIdx);
  };

  this.record = function () {
    let action = this._getAction();
    let actionList = action.actionList;

    let data = this._getData();
    // console.log(data);
    if (data == null) return false;

    if (action.actionIdx == actionList.length)
      action.actionIdx = actionList.length - 1;
    else if (action.actionIdx < actionList.length - 1)
      this.clear(action.actionIdx + 1);

    // console.log(actionList.length);

    if (
      actionList.length == 0 ||
      (actionList.length > 0 &&
        !this._isEqual(actionList[actionList.length - 1], data))
    ) {
      actionList.push(data);
      // console.log(actionList);
      action.actionIdx++;
      this.stateCheck();
      return true;
    }

    return false;
  };

  this.clear = function (idx) {
    // console.log(idx);
    let action = this._getAction();
    let actionList = action.actionList;

    for (let i = actionList.length - 1; i >= idx; i--) {
      actionList.splice(i, 1);
      action.actionIdx = i - 1;
    }
    this.stateCheck();
  };

  /**
   * 恢复初始化状态
   */
  this.reset = function () {
    this._actionDict = {};
  };

  this.stateCheck = function () {
    let action = this._getAction();

    action.canUndo = true;
    action.canRedo = true;
    if (action.actionList.length == 0) {
      action.canUndo = false;
      action.canRedo = false;
    } else if (action.actionIdx >= action.actionList.length - 1) {
      action.canRedo = false;
    } else if (action.actionIdx <= 0) {
      action.canUndo = false;
    }
  };
}
