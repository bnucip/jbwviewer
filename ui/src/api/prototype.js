// Adds the specified content immediately after this node.
Element.prototype.addAfterSelf = function () {
  let nodes = [].concat.apply([], arguments);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    this.insertAdjacentElement('afterend', node);
  }
};

// Adds the specified content immediately before this node. 向该节点前面添加一个或多个节点
Element.prototype.addBeforeSelf = function () {
  let nodes = [].concat.apply([], arguments);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    this.insertAdjacentElement('beforebegin', node);
  }
};

// Adds the specified content as the first children of this document or element.
Element.prototype.addFirst = function () {
  let nodes = [].concat.apply([], arguments);
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    this.insertAdjacentElement('afterbegin', node);
  }
};

/**
 * 向Element添加一个或多个子结点
 * 注：append只支持append(n1)、append(n1, n2)不支持直接添加数组
 */
Element.prototype.appendArray = function () {
  let nodes = [].concat.apply([], arguments);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    this.append(node);
  }
};

/**
 * 获取tagName等于name的一个子Element
 * @param {String} name
 * @returns
 */
Element.prototype.element = function (name) {
  if (name == undefined || name == null) return null;
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (child.tagName == name) return child;
  }
  return null;
};

/**
 * 获取tagName等于name的子Element[]
 * @param {String} name
 * @returns
 */
Element.prototype.elements = function (name) {
  let elems = [];
  for (let i = 0; i < this.children.length; i++) {
    const child = this.children[i];
    if (name != undefined) {
      if (child.tagName == name) elems.push(child);
    } else elems.push(child);
  }
  return elems;
};

Element.prototype.elementsAfterSelf = function (name) {
  let elems = [];
  let next = this.nextElementSibling;
  while (next != null) {
    if (name != undefined) {
      if (next.tagName == name) elems.push(next);
    } else elems.push(next);
    next = next.nextElementSibling;
  }

  return elems;
};

Element.prototype.elementsBeforeSelf = function (name) {
  let elems = [];
  let prev = this.previousElementSibling;
  while (prev != null) {
    if (name != undefined) {
      if (prev.tagName == name) elems.unshift(prev);
    } else elems.unshift(prev);

    prev = prev.previousElementSibling;
  }

  return elems;
};

Element.prototype.isAfter = function (node) {
  if (node == undefined || node == null) return false;

  let prev = this.previousElementSibling;
  while (prev != null) {
    if (prev == node) return true;
    prev = prev.previousElementSibling;
  }
  return false;
};

Element.prototype.isBefore = function (node) {
  if (node == undefined || node == null) return false;

  let next = this.nextElementSibling;
  while (next != null) {
    if (next == node) return true;
    next = next.nextElementSibling;
  }
  return false;
};

/**
 * 是否只包含一个空<x/>节点
 * @returns
 */
Element.prototype.isEmptyX = function () {
  return this.innerHTML == '<x/>';
};

//是否为顶起成分
Element.prototype.isLifter = function () {
  let child = this.firstElementChild;
  let hasPrd = false;
  let hasNpVir = false;
  while (child != null) {
    let cName = child.tagName;
    if (cName == XmlTags.C_Wei) hasPrd = true;
    else if (
      cName == XmlTags.C_PP ||
      cName == XmlTags.C_FF ||
      cName == XmlTags.C_UN ||
      (cName == XmlTags.C_CC &&
        child.hasAttribute(XmlTags.A_Fun) &&
        (child.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_COO ||
          child.getAttribute(XmlTags.A_Fun) == XmlTags.V_Fun_APP))
    )
      hasNpVir = true;
    child = child.nextElementSibling;
  }

  return hasPrd && hasNpVir;
};

/**
 * 不区分大小写判断节点名tagName
 * @returns
 */
Element.prototype.nameIs = function () {
  let names = [].concat.apply([], arguments);
  let tagUpper = this.tagName.toUpperCase();
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (name == null || typeof name != 'string') continue;

    if (tagUpper == name.toUpperCase()) return true;
  }

  return false;
};

/**
 * 移除当前节点标记，把子结点上移一层
 * @returns
 */
Element.prototype.removeSelfTag = function () {
  let pNode = this.parentNode;
  if (pNode == null) return;

  let child = this.firstChild;
  while (child != null) {
    this.addBeforeSelf(child);
    child = this.firstChild;
  }
  pNode.removeChild(this);
};

/**
 * 修改当前节点的标签名
 * @returns
 */
Element.prototype.replaceTagName = function (newName) {
  let xmlDoc = new Document();
  let newNode = xmlDoc.createElement(newName);
  let child = this.firstChild;
  while (child != null) {
    newNode.append(child);
    child = this.firstChild;
  }
  let pNode = this.parentNode;
  if (pNode != null && pNode.nodeType == 1) {
    this.addBeforeSelf(newNode);
    pNode.removeChild(this);
  }

  return newNode;
};

Element.prototype.toPlainString = function () {
  let xmlString;
  try {
    if (window.ActiveXObject) {
      xmlString = this.xml;
    }
    // code for Mozilla, Firefox, Opera, etc.
    else {
      xmlString = new XMLSerializer().serializeToString(this);
    }
  } catch (e) {
    xmlString = 'error!';
  }
  //this.outerHTML
  return xmlString;
};

Document.prototype.createElementNew = function (tagName, innerHtml) {
  let element = this.createElement(tagName);
  element.innerHTML = innerHtml;
  return element;
};

Array.prototype.contains = function (elem) {
  return this.indexOf(elem) != -1;
};

Array.prototype.descendantsAndSelf = function (name) {
  let elems = [];
  let length = this.length;

  for (let i = 0; i < length; i++) {
    const el = this[i];
    if (!el instanceof Element) continue;
    if (name == undefined || el.tagName == name) elems.push(el);

    elems = elems.concat(el.elements().descendantsAndSelf(name));
  }
  return elems;
};

Array.prototype.firstOrDefault = function (predicate, context) {
  var length = this.length;
  for (let i = 0; i < length; i++) {
    if (predicate != undefined) {
      if (predicate.call(context, this[i], i, this)) return this[i];
    } else return this[i];
  }
  return null;
};

Array.prototype.last = function (predicate, context) {
  var length = this.length;
  for (var i = length - 1; i >= 0; i--) {
    if (predicate != undefined) {
      if (predicate.call(context, this[i], i, this)) return this[i];
    } else return this[i];
  }
  return null;
};

Array.prototype.lastOrDefault = function (predicate, context) {
  var length = this.length;
  for (var i = length - 1; i >= 0; i--) {
    if (predicate != undefined) {
      if (predicate.call(context, this[i], i, this)) return this[i];
    } else return this[i];
  }
  return null;
};

Array.prototype.remove = function (val) {
  var index = this.indexOf(val);
  if (index > -1) {
    this.splice(index, 1);
  }
};

Node.prototype.ancestor = function (type) {
  let name;
  if (typeof type == 'string') name = type;
  else if (type == null || type.name == null) return null;
  else name = type.name;

  let parent = this.parentNode;
  let pVue = this.__vue__;
  // console.log(pVue);
  while (pVue == null && parent != null && parent.nodeName != 'BODY') {
    if (parent.__vue__ != undefined) {
      pVue = parent.__vue__;
      break;
    }
    parent = parent.parentNode;
  }
  while (pVue != null && pVue.$options.name != name) pVue = pVue.$parent;
  return pVue;
};

Node.prototype.removeAllChildren = function () {
  while (this.firstChild) {
    this.removeChild(this.firstChild);
  }
};

/**
 * ⽐较两个字符串是否相等，不区分⼤⼩写
 * @param {String} str
 * @returns {Boolean}
 */
String.prototype.equalIgnoreCase = function (str) {
  var t1 = this.toLowerCase();
  var t2 = str.toLowerCase();
  return t1 == t2;
};

/**
 * 先在字符串中标点前后插入空格，返回trim首尾的字符串
 * @param trim{Boolean}: 是否trim首尾空白，默认为true
 * @returns String
 */
String.prototype.insertPuncSpace = function (trim = true) {
  let str = this;
  let spaceBefore = new RegExp(GlobalConst.SpaceBefore, 'g');
  let spaceAfter = new RegExp(GlobalConst.SpaceAfter, 'g');
  str = str.replace(spaceBefore, ' ').replace(spaceAfter, ' ');
  if (trim) str = str.trim();
  return str;
};

/**
 * 获取文本px宽度
 * @param font{String}: 字体样式
 */
String.prototype.pxWidth = function (font) {
  // re-use canvas object for better performance
  var canvas =
      String.prototype.pxWidth.canvas ||
      (String.prototype.pxWidth.canvas = document.createElement('canvas')),
    context = canvas.getContext('2d');

  font && (context.font = font);
  var metrics = context.measureText(this);

  return metrics.width;
};

/**
 * 移除空格
 * @returns {String}
 */
String.prototype.removeSpace = function () {
  return this.replace(/\s+/g, '');
};

/**
 * xml字符串转Element
 * @returns {Element}
 */
String.prototype.toXml = function () {
  // 如果是标准XML文件，则编码是UT-8无BOM
  let xmlDoc = new DOMParser().parseFromString(this, 'application/xml');
  if (xmlDoc.getElementsByTagName('parsererror').length == 0) {
    return xmlDoc.firstElementChild;
  }

  return null;
};

function ancestor(type) {
  let name;
  if (typeof type == 'string') name = type;
  else if (type == null || type.name == null) return null;
  else name = type.name;

  let pVue = this.$parent;
  // console.log(pVue);
  while (pVue != null && pVue.$options.name != name) {
    pVue = pVue.$parent;
    // console.log(pVue);
  }
  return pVue;
  // return this.$el.ancestor(type);
}
Vue.prototype.ancestor = ancestor;

function belongType() {
  let types = [].concat.apply([], arguments);
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    if (type == null) continue;

    let name;
    if (typeof type == 'string') name = type;
    else if (type.name == null) return false;
    else name = type.name;
    if (
      this.$options.name == name ||
      (this.$options.extends != null && this.$options.extends.name == name)
    )
      return true;
  }
  return false;
}

Vue.prototype.belongType = belongType;

function belongIniType() {
  let types = [].concat.apply([], arguments);
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    if (this.iniType == type) return true;
  }
  return false;
}
// Vue.prototype.belongIniType = belongIniType;

/**
 * 获取Type类型符合的最上层VueComponent，没有则返回null
 * @param types 支持单个、多个、数组
 * @returns VueComponent
 */
const getTopComptByType = function () {
  let types = [].concat.apply([], arguments);
  let top = null;
  let parent = this.$parent;
  while (parent != null) {
    if (parent.belongType && parent.belongType(types)) top = parent;
    parent = parent.$parent;
  }

  if (top == null && this.belongType(types)) top = this;

  return top;
};

Vue.prototype.getTopComptByType = getTopComptByType;
/**
 * 获取符合iniType的最上层VueComponent，没有则返回null
 * @param iniTypes 支持单个、多个、数组
 * @returns VueComponent
 */
const getTopComptByIniType = function () {
  let types = [].concat.apply([], arguments);
  let top = null;
  let parent = this.$parent;
  while (parent != null) {
    if (types.contains(parent.iniType)) top = parent;
    parent = parent.$parent;
  }
  return top;
};
Vue.prototype.getTopComptByIniType = getTopComptByIniType;

// todo 需改为通过外部绑定
function getEditor() {
  let editor = this.ancestor('Index');
  if (editor) return editor;
  return this.ancestor('LexiconEdit');
}
Vue.prototype.getEditor = getEditor;

Vue.prototype.qAlert = function (msg) {
  this.$q.dialog({
    title:
      '<span class="material-icons text-warning" style="font-size:2em">warning</span>',
    message: '<div style="text-align:center;">' + msg + '</div>',
    html: true,
  });
};

Vue.prototype.xmlText = function () {
  return this.toXml ? this.toXml().textContent : null;
};

import GlobalConst from '../enum/global_variable.js';
import XmlTags from './xml_tags.js';
import { VueElement as Vue } from 'vue';
// import Vue from 'vue';

export {
  ancestor,
  belongType,
  belongIniType,
  getEditor,
  getTopComptByIniType,
  getTopComptByType,
};
