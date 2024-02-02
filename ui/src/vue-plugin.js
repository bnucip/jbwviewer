import './api/prototype.js';
import GridUtil from './api/grid_util.js';
import {
  ancestor,
  belongIniType,
  belongType,
  getEditor,
  getTopComptByIniType,
  getTopComptByType,
} from './api/prototype.js';
import {
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
} from './api/grid_util.js';

import JbwViewer from './components/Diagram.vue'; // JbwViewer   Diagram
import Directive from './directives/Directive';
import StorageKey from './enum/storage_key.js';
import XmlTags from './api/xml_tags.js';
import XmlParser from './api/xml_parser.js';
import ExprConverter from './api/expr_converter.js';

import DataTags from './enum/data_tags.js';
import DictType from './enum/dict_type.js';
import ExprTags from './api/expr_tags.js';
import GlobalConst from './enum/global_variable.js';
import MovingType from './enum/moving_type.js';
import PlugType from './enum/plug_type.js';
import PrdExtend from './enum/prd_extend.js';
import RelationType from './enum/relation_type.js';
import TextRegion from './enum/text_region.js';
import TextType from './enum/text_type.js';
import UniPos from './enum/uni_pos.js';

import Diagram from './components/Diagram.vue';
import BaseCompt from './components/BaseCompt.vue';
import TextCompt from './components/TextCompt.vue';
import GridCompt from './components/GridCompt.vue';
import StackCompt from './components/StackCompt.vue';

import FillLifter from './components/assist/FillLifter.vue';
import SbjSep from './components/assist/SbjSep.vue';
import PrdSep from './components/assist/PrdSep.vue';
import ObjSep from './components/assist/ObjSep.vue';
import WordFlag from './components/assist/WordFlag.vue';

const version = __UI_VERSION__;

function install(app) {
  // model
  app.config.globalProperties.GlobalConst = GlobalConst;
  app.config.globalProperties.TextType = TextType;
  app.config.globalProperties.XmlTags = XmlTags;
  // method
  app.config.globalProperties.ancestor = ancestor;
  app.config.globalProperties.belongType = belongType;
  app.config.globalProperties.belongIniType = belongIniType;
  app.config.globalProperties.getChild = getChild;
  app.config.globalProperties.getEditor = getEditor;
  app.config.globalProperties.getTopComptByIniType = getTopComptByIniType;
  app.config.globalProperties.getTopComptByType = getTopComptByType;
  app.config.globalProperties.leftCompts = leftCompts;
  app.config.globalProperties.leftElems = leftElems;
  app.config.globalProperties.leftNpCompts = leftNpCompts;
  app.config.globalProperties.leftRegion = leftRegion;
  app.config.globalProperties.leftRegionCompts = leftRegionCompts;
  app.config.globalProperties.nearestLeftCompt = nearestLeftCompt;
  app.config.globalProperties.nearestLeftElem = nearestLeftElem;
  app.config.globalProperties.nearestRightCompt = nearestRightCompt;
  app.config.globalProperties.nearestRightElem = nearestRightElem;
  app.config.globalProperties.prdExtend = prdExtend;
  app.config.globalProperties.rightComptItems = rightComptItems;
  app.config.globalProperties.rightCompts = rightCompts;
  app.config.globalProperties.rightElems = rightElems;
  app.config.globalProperties.rightNpCompts = rightNpCompts;
  app.config.globalProperties.rightRegion = rightRegion;
  app.config.globalProperties.rightRegionCompts = rightRegionCompts;
  app.config.globalProperties.rightRegionElems = rightRegionElems;
  // util
  app.config.globalProperties.GridUtil = GridUtil;
  app.config.globalProperties.XmlParser = XmlParser;

  app.component('JbwViewer', JbwViewer);
  app.directive(Directive.name, Directive);
}

export {
  version,
  // directive
  Directive,
  // Component
  JbwViewer,
  Diagram,
  BaseCompt,
  TextCompt,
  GridCompt,
  StackCompt,
  FillLifter,
  SbjSep,
  PrdSep,
  ObjSep,
  WordFlag,
  // 常量
  DataTags,
  DictType,
  ExprTags,
  GlobalConst,
  MovingType,
  PlugType,
  PrdExtend,
  RelationType,
  StorageKey,
  XmlTags,
  TextType,
  TextRegion,
  UniPos,
  // 方法类
  ExprConverter,
  GridUtil,
  XmlParser,
  install,
};
