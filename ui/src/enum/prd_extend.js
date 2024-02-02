import XmlTags from '../api/xml_tags';

// 复杂句式谓语的扩展方式
const NULL = 'NULL';
const NORMAL = 'NORMAL';
const SYN = XmlTags.V_Fun_SYN; //合成
const PVT = XmlTags.V_Fun_PVT; //兼语
const SER = XmlTags.V_Fun_SER; //连动
const UNI = XmlTags.V_Fun_UNI; //联合

export default {
  NULL,
  NORMAL,
  SYN,
  PVT,
  SER,
  UNI,
};
