const innerItemStyle = {
  opacity: 0.8,
  color: "rgb(115 192 222)",
  borderColor: "rgb(255 255 255)",
  borderWidth: 1,
  borderType: "solid",
};
const outerItemStyle = {
  opacity: 0.8,
  color: "white",
};

const emphasisItemStyle = {
  opacity: 1,
  color: "rgb(84 112 198)",
};

const innerRadius = [10, 120];
const outerRadius = [121, 300];

const innerLabel = {
  color: "black",
  position: "inner",
  fontSize: 14,
  fontWeight: "bold",
};
const outerLabel = {
  color: "black",
  position: "inner",
  fontSize: 14,
  fontWeight: "bold",
};

// 内圈1：宾语 状语 主语 谓语
const pieData1 = [
  {
    name: "宾语",
    value: 20,
    label: XmlTags.C_Bin,
    method: "addObj",
    // nodeClick: "null",//点击后调转link节点
  },
  { value: 0 },
  { value: 0 },
  {
    name: "状语",
    value: 20,
    label: XmlTags.C_Zhuang,
    method: "addAdv",
  },
  { value: 0 },
  { value: 0 },
  {
    name: "主语",
    value: 20,
    label: XmlTags.C_Zhu,
    method: "addSbj",
  },
  { value: 0 },
  { value: 0 },
  {
    name: "谓语",
    value: 20,
    label: "lift",
    method: "addPrdLift",
  },
  { value: 0 },
  { value: 0 },
];

// 内圈2：方位词 定语
const pieData2 = [
  {
    name: "□方位词",
    value: 20,
    label: XmlTags.C_FF,
    method: "addNextVirtual",
  },
  { value: 0 },
  { value: 0 },
  {
    name: "定语",
    value: 20,
    label: XmlTags.C_Ding,
    method: "addAtt",
  },
  { value: 0 },
  { value: 0 },
];

// 内圈3：补语 介词
const pieData3 = [
  {
    name: "补语",
    value: 20,
    label: XmlTags.C_Bu,
    method: "addCmp",
  },
  { value: 0 },
  { value: 0 },
  {
    name: "介词∧",
    value: 20,
    label: XmlTags.C_PP,
    method: "addPrevVirtual",
  },
  { value: 0 },
  { value: 0 },
];

// 外圈1：复句 助动 连词
const pieData4 = [
  { value: 0 },
  { value: 0 },
  { value: 0 },
  {
    name: "复句",
    value: 10,
    label: "stack",
    method: "extendStack",
  },
  { value: 0 },
  { value: 0 },
  {
    name: "助动",
    value: 10,
    label: XmlTags.V_Fun_SYN,
    method: "extendVpCore",
  },
  { value: 0 },
  { value: 0 },
  {
    name: "⠉连词⠁",
    value: 10,
    label: XmlTags.C_CC,
    method: "addPrevVirtual",
  },
  { value: 0 },
  { value: 0 },
];

// 外圈2-1：联合(VP) 联合(NP)
const pieData50 = [
  {
    name: "⠒联合⠂\r\n(VP)",
    value: 10,
    label: XmlTags.V_Fun_UNI,
    method: "extendVpCore",
  },
  {
    name: "⣀联合⡀\r\n(NP)",
    value: 10,
    label: XmlTags.V_Fun_COO,
    method: "extendNpCore",
  },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

// 外圈2-2：联合(VP)
const pieData51 = [
  {
    name: "⠒联合⠂",
    value: 10,
    label: XmlTags.V_Fun_UNI,
    method: "extendVpCore",
  },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

// 外圈2-3：联合(NP)
const pieData52 = [
  {
    name: "⣀联合⡀",
    value: 10,
    label: XmlTags.V_Fun_COO,
    method: "extendNpCore",
  },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

// 外圈3：独立语（后）
const pieData6 = [
  {
    name: "独立语\r\n（后）",
    value: 10,
    label: XmlTags.C_Ind,
    method: "addNextInd",
  },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

// 外圈4：独立语（前）
const pieData7 = [
  {
    name: "独立语\r\n（前）",
    value: 10,
    label: XmlTags.C_Ind,
    method: "addPrevInd",
  },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

// 外圈5：助词△ 助词▽ ▽助词 △助词
const pieData8 = [
  {
    name: "助词△\r\n（附NP）",
    value: 10,
    label: XmlTags.C_UN,
    method: "addPrevVirtual",
  },
  {
    name: "助词▽\r\n（附VP）",
    value: 10,
    label: XmlTags.C_UV,
    method: "addPrevVirtual",
  },
  { value: 0 },
  {
    name: "▽助词\r\n（附VP）",
    value: 10,
    label: XmlTags.C_UV,
    method: "addNextVirtual",
  },
  {
    name: "△助词\r\n（附NP）",
    value: 10,
    label: XmlTags.C_UN,
    method: "addNextVirtual",
  },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
  { value: 0 },
];

const empty = { value: 0 };
const uv1 = {
  name: "助词▽",
  value: 10,
  label: XmlTags.C_UV,
  method: "addPrevVirtual",
};
const uv2 = {
  name: "▽助词",
  value: 10,
  label: XmlTags.C_UV,
  method: "addNextVirtual",
};
const un1 = {
  name: "助词△",
  value: 10,
  label: XmlTags.C_UN,
  method: "addPrevVirtual",
};
const un2 = {
  name: "△助词",
  value: 10,
  label: XmlTags.C_UN,
  method: "addNextVirtual",
};
const prd = {
  name: "谓语",
  value: 20,
  label: "lift",
  method: "addPrdLift",
};
const split = {
  name: "拆分",
  value: 20,
  label: "split",
  method: "splitCompt",
};

import { XmlTags } from "jbw-viewer";

export {
  innerItemStyle,
  outerItemStyle,
  emphasisItemStyle,
  innerRadius,
  outerRadius,
  innerLabel,
  outerLabel,
  pieData1,
  pieData2,
  pieData3,
  pieData4,
  pieData50,
  pieData51,
  pieData52,
  pieData6,
  pieData7,
  pieData8,
  empty,
  uv1,
  uv2,
  un1,
  un2,
  prd,
  split,
};
