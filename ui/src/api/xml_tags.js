const A_Sen = "sen"; // 义码
const A_Mod = "mod"; // 模式
const A_Dict = "dct"; // 词典类型
const A_Id = "id"; // 小句id
const A_Expand = "expand"; // 段落中句子标记
const A_Auto = "auto"; // 自动分析标记
const A_Ignore = "ignore"; // 非句标记

const A_Ptt = "ptt";
const V_PTT_SVO = "SVO";
const V_PTT_VO = "VO";
const V_PTT_H = "H";
const V_PTT_VOS = "VOS";
const V_PTT_SOV = "SOV";

//prd
const A_Scp = "scp";
const V_SCP_V = "V";
const V_SCP_VO = "VO";
const V_SCP_VC = "VC";
const V_SCP_VOO = "VOO";
const V_SCP_VOC = "VOC";
const V_SCP_VCO = "VCO";
const V_SCP_VOOC = "VOOC";

const A_Inv = "inv"; // 倒装标记

// 句间关系
const A_Indent = "upt";
const A_Coh = "coh"; //衔接关系cohesion
const V_Coh_ALL = "↡"; //整体作另一句的主题
const V_Coh_END = "⫰"; //独立句（带主语的可充当独立语的句子）
const V_Coh_END_Up = "⫯";
const V_Coh_PRE = "⋮"; //划线位置前面所有成分（主语不变）
const V_Coh_ONE = "⇣"; //单个成分或整体作另一句的主题
const V_Coh_ONE_Up = "⇡";
const A_Rel = "rel"; // 句间关系
const A_Sub = "sub"; // 句间主从指向关系
const A_Err = "err"; // 关系偏误  1-句间  2-句内  3-句间句内
const A_Eoj = "eoj"; // 句内偏误
const A_Eor = "eor"; // 句间偏误

const V_Indent_S = "s";
const V_Indent_E = "e";

// 多核谓语
const A_Fun = "fun";
const V_Fun_APP = "APP";
const V_Fun_COO = "COO";
const V_Fun_COO1 = "coo"; // 定语间连词
const V_Fun_UNI1 = "uni"; // 状语间连词
const V_Fun_UNI = "UNI"; //联合
const V_Fun_SER = "SER"; //连动
const V_Fun_PVT = "PVT"; //兼语
const V_Fun_SYN = "SYN"; //助动

const Np_Fun = [V_Fun_APP, V_Fun_COO, V_Fun_COO1];
const Prd_Fun = [V_Fun_UNI, V_Fun_SER, V_Fun_PVT, V_Fun_SYN];
const CC_Text_Fun = [V_Fun_APP, V_Fun_COO, V_Fun_UNI, V_Fun_COO1, V_Fun_UNI1]; // 有文本的连词框

const X_Jbw = "jbw";
const X_Paras = "paras";
//--成分--
const C_Para = "para";
const C_FullSent = "ju";
const C_Sent = "xj";

const C_Zhu = "sbj";
const C_Wei = "prd";
const C_Bin = "obj";
const C_Ding = "att";
const C_Zhuang = "adv";
const C_Bu = "cmp";
const C_Ind = "ind";

const C_Sub = [C_Ding, C_Zhuang, C_Bu, C_Ind];

const C_PP = "pp";
const C_CC = "cc";
const C_UN = "un";
const C_UV = "uv";
const C_UU = "uu";
const C_FF = "ff";

const C_XX = [C_PP, C_CC, C_UN, C_UV, C_UU, C_FF];
const C_No_Split = [C_PP, C_UN, C_UV, C_UU, C_FF, V_Fun_COO1];
const Np_Compt = [C_Ding, C_PP, C_FF, C_UN, V_Fun_APP, V_Fun_COO];

const O_Sent = "sent";
const O_Temp = "temp";
const O_Generic = "_generic";
const O_Copy = "xcopy";
const O_Full = "full";
const O_Pre = "pre";
const O_Next = "next";
const O_Sptsbj = "sptsbj";
const O_Sptobj = "sptobj";

//--词类--
const W_Ming = "n";
const W_Ming_ShiJian = "t";
const W_Ming_Fangwei = "f";
const W_Shu = "m";
const W_Liang = "q";
const W_Dai = "r";

const W_Dong = "v";
const W_XingRong = "a";
const W_Fu = "d";

const W_Jie = "p";
const W_Lian = "c";
const W_Zhu = "u";

const W_Tan = "e";
const W_NiSheng = "o";
const W_BiaoDian = "w";
const W_QueSheng = "x";

const W_All = [
  W_Ming,
  W_Ming_ShiJian,
  W_Ming_Fangwei,
  W_Shu,
  W_Liang,
  W_Dai,
  W_Dong,
  W_XingRong,
  W_Fu,
  W_Jie,
  W_Lian,
  W_Zhu,
  W_Tan,
  W_NiSheng,
  W_BiaoDian,
  W_QueSheng,
];

/**
 * 根据虚词成分类型，返回对应的词性
 * @param {String} iniType
 * @returns
 */
function virtualPos(iniType) {
  let pos;
  switch (iniType) {
    case C_FF:
      pos = W_Ming_Fangwei;
      break;
    case C_PP:
      pos = W_Jie;
      break;
    case C_CC:
    case V_Fun_APP:
    case V_Fun_COO:
    case V_Fun_UNI:
    case V_Fun_COO1:
    case V_Fun_UNI1:
      pos = W_Lian;
      break;
    case C_UU:
    case C_UN:
    case C_UV:
      pos = W_Zhu;
      break;
    default:
      pos = W_QueSheng;
      break;
  }
  return pos;
}

/**
 * 根据成分，获取成分对应的优先词类
 * @param {String} iniType
 */
function defaultPos(iniType) {
  let pos = "";
  switch (iniType) {
    case C_Zhu:
    case C_Bin:
      pos = W_Ming;
      break;

    case C_Wei:
      pos = W_Dong;
      break;

    case C_Ding:
    case C_Bu:
      pos = W_Dong;
      break;
    case C_Zhuang:
      pos = W_Fu;
      break;
    case C_Ind:
      pos = W_Ming;
      break;

    default:
      pos = virtualPos(iniType);
      break;
  }
  return pos;
}

/**
 * 根据成分类型，返回对应的词性列表
 * @param {String} iniType
 * @returns
 */
function comptPosList(iniType) {
  let pos;
  switch (iniType) {
    // 主语：n t f m q r e
    case C_Zhu: {
      pos = [W_Ming, W_Ming_ShiJian, W_Ming_Fangwei, W_Shu, W_Liang, W_Dai, W_Tan];
      break;
    }
    // 宾语 m t f m q r
    case C_Bin: {
      pos = [W_Ming, W_Ming_ShiJian, W_Ming_Fangwei, W_Shu, W_Liang, W_Dai];
      break;
    }
    // 谓语 v a r o
    case C_Wei:
      pos = [W_Dong, W_XingRong, W_Dai, W_NiSheng];
      break;
    // 定语 m t f m q r v a o
    case C_Ding: {
      pos = [W_Ming, W_Ming_ShiJian, W_Ming_Fangwei, W_Shu, W_Liang, W_Dai, W_Dong, W_XingRong, W_NiSheng];
      break;
    }
    // 状补 m t f m q r v a o d
    case C_Zhuang:
    case C_Bu: {
      pos = [W_Ming, W_Ming_ShiJian, W_Ming_Fangwei, W_Shu, W_Liang, W_Dai, W_Dong, W_XingRong, W_NiSheng, W_Fu];
      break;
    }
    // 独立语 m t f m q r a d e o
    case C_Ind: {
      pos = [W_Ming, W_Ming_ShiJian, W_Ming_Fangwei, W_Shu, W_Liang, W_Dai, W_Dong, W_XingRong, W_Fu, W_Tan, W_NiSheng];
      break;
    }
    // 虚词
    default:
      pos = [virtualPos(iniType)];
      break;
  }
  return pos;
}

export default {
  A_Sen,
  A_Mod,
  A_Dict,
  A_Id,
  A_Expand,
  A_Auto,
  A_Ignore,

  A_Ptt,
  V_PTT_SVO,
  V_PTT_VO,
  V_PTT_H,
  V_PTT_VOS,
  V_PTT_SOV,
  A_Scp,
  V_SCP_V,
  V_SCP_VO,
  V_SCP_VC,
  V_SCP_VOO,
  V_SCP_VOC,
  V_SCP_VCO,
  V_SCP_VOOC,

  A_Inv,
  A_Indent,
  V_Indent_S,
  V_Indent_E,
  A_Coh,
  V_Coh_ALL,
  V_Coh_PRE,
  V_Coh_ONE,
  V_Coh_ONE_Up,
  V_Coh_END,
  V_Coh_END_Up,
  A_Rel,
  A_Sub,
  A_Err,
  A_Eoj,
  A_Eor,

  A_Fun,
  V_Fun_APP,
  V_Fun_COO,
  V_Fun_UNI,
  V_Fun_SER,
  V_Fun_PVT,
  V_Fun_SYN,
  V_Fun_COO1,
  V_Fun_UNI1,
  CC_Text_Fun,

  Np_Fun,
  Prd_Fun,

  C_Para,
  C_FullSent,
  C_Sent,
  C_Zhu,
  C_Wei,
  C_Bin,
  C_Ding,
  C_Zhuang,
  C_Sub,
  Np_Compt,
  C_Bu,
  C_Ind,
  C_PP,
  C_CC,
  C_UN,
  C_UV,
  C_UU,
  C_FF,
  C_XX,
  C_No_Split,
  O_Sent,
  O_Temp,
  O_Generic,
  O_Copy,
  O_Full,
  O_Pre,
  O_Next,
  O_Sptsbj,
  O_Sptobj,

  W_Ming,
  W_Ming_ShiJian,
  W_Ming_Fangwei,
  W_Shu,
  W_Liang,
  W_Dai,
  W_Dong,
  W_XingRong,
  W_Fu,
  W_Jie,
  W_Lian,
  W_Zhu,
  W_Tan,
  W_NiSheng,
  W_BiaoDian,
  W_QueSheng,
  W_All,

  X_Jbw,
  X_Paras,

  virtualPos,
  defaultPos,
  comptPosList,
};
