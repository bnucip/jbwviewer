import XmlTags from './xml_tags';

const Default = '×';

//--句法--
const Syn_Sbj = '║'; // U+2551
const Syn_Sbj_L = '≅'; // U+2245
const Syn_Obj = '│'; // U+2502
const Syn_Obj_R = '≃'; // U+2243
const Syn_Att_L = '﹙';
const Syn_Att_R = '﹚';
const Syn_Adv_L = '﹝';
const Syn_Adv_R = '﹞';
const Syn_Cmp_L = '﹤';
const Syn_Cmp_R = '﹥';
const Syn_Ind_L = '〖';
const Syn_Ind_R = '〗';

const Syn_FF = '□';
const Syn_PP = '∧';
const Syn_PP_L = '∨';
const Syn_CC_L = '⠉'; // U+2808
const Syn_CC_R = '⠁'; // U+2801
const Syn_CC_Uni_L = '⠒'; // U+2812
const Syn_CC_Uni_R = '⠂'; // U+2802
const Syn_CC_Uni1_L = '⣀'; // U+28C0
const Syn_CC_Uni1_R = '⠂'; // U+2802
const Syn_CC_Coo_L = '⠤'; // U+2824
const Syn_CC_Coo_R = '⠄'; // U+2804
const Syn_CC_Coo1_L = '⣀'; // U+28C0
const Syn_CC_Coo1_R = '⡀'; // U+2840
const Syn_CC_App_L = '≔';
const Syn_CC_App_R = '≕';
const Syn_CC_PVT = '⫽';
const Syn_CC_SER = '／';
const Syn_CC_SYN = '∶';
const Syn_UU_L = '▷';
const Syn_UU_R = '◁';
const Syn_UN_L = '△';
const Syn_UN_R = '▲';
const Syn_UV_L = '▽';
const Syn_UV_R = '▼';

const Syn_Lift_L = '﹛';
const Syn_Lift_R = '﹜';
const Syn_Lift_M = '§';

const Syn_All =
  Syn_Sbj +
  Syn_Obj +
  Syn_Att_L +
  Syn_Att_R +
  Syn_Adv_L +
  Syn_Adv_R +
  Syn_Cmp_L +
  Syn_Cmp_R +
  Syn_Ind_L +
  Syn_Ind_R +
  Syn_FF +
  Syn_PP +
  Syn_CC_L +
  Syn_CC_R +
  Syn_CC_Uni_L +
  Syn_CC_Uni_R +
  Syn_CC_Coo_L +
  Syn_CC_Coo_R +
  Syn_CC_Uni1_L +
  Syn_CC_Uni1_R +
  Syn_CC_Coo1_L +
  Syn_CC_Coo1_R +
  Syn_CC_App_L +
  Syn_CC_App_R +
  Syn_CC_PVT +
  Syn_CC_SER +
  Syn_CC_SYN +
  Syn_UU_L +
  Syn_UU_R +
  Syn_UN_L +
  Syn_UN_R +
  Syn_UV_L +
  Syn_UV_R +
  Syn_Lift_L +
  Syn_Lift_R +
  Syn_Lift_M;

const Syn_No_UU =
  Syn_Sbj +
  Syn_Obj +
  Syn_Att_L +
  Syn_Att_R +
  Syn_Adv_L +
  Syn_Adv_R +
  Syn_Cmp_L +
  Syn_Cmp_R +
  Syn_Ind_L +
  Syn_Ind_R +
  Syn_FF +
  Syn_PP +
  Syn_CC_L +
  Syn_CC_R +
  Syn_CC_Uni_L +
  Syn_CC_Uni_R +
  Syn_CC_Coo_L +
  Syn_CC_Coo_R +
  Syn_CC_App_L +
  Syn_CC_App_R +
  Syn_CC_PVT +
  Syn_CC_SER +
  Syn_CC_SYN +
  Syn_UN_L +
  Syn_UN_R +
  Syn_UV_L +
  Syn_UV_R +
  Syn_Lift_L +
  Syn_Lift_R +
  Syn_Lift_M;

/**
 * 排除方、介、非角上助词
 */
const Syn_No_Vir1 =
  Syn_Sbj +
  Syn_Obj +
  Syn_Att_L +
  Syn_Att_R +
  Syn_Adv_L +
  Syn_Adv_R +
  Syn_Cmp_L +
  Syn_Cmp_R +
  Syn_Ind_L +
  Syn_Ind_R +
  Syn_CC_L +
  Syn_CC_R +
  Syn_CC_Uni_L +
  Syn_CC_Uni_R +
  Syn_CC_Coo_L +
  Syn_CC_Coo_R +
  Syn_CC_App_L +
  Syn_CC_App_R +
  Syn_CC_PVT +
  Syn_CC_SER +
  Syn_CC_SYN +
  Syn_UU_L +
  Syn_UU_R +
  Syn_Lift_L +
  Syn_Lift_R +
  Syn_Lift_M;

const Syn_Additives_L = Syn_Att_L + Syn_Adv_L + Syn_Cmp_L + Syn_Ind_L; // 附加成分左括号
const Syn_Additives_R = Syn_Att_R + Syn_Adv_R + Syn_Cmp_R + Syn_Ind_R; // 附加成分右括号
const Syn_Brackets_L = Syn_Additives_L + Syn_Lift_L; // 所有左括号
const Syn_Brackets_R = Syn_Additives_R + Syn_Lift_R; // 所有右括号
const Syn_PrdLayMark =
  Syn_Sbj +
  Syn_Obj +
  Syn_Adv_L +
  Syn_Adv_R +
  Syn_Cmp_L +
  Syn_Cmp_R +
  Syn_CC_PVT +
  Syn_CC_SER +
  Syn_CC_SYN +
  Syn_CC_Uni_L +
  Syn_CC_Uni_R;

/**
 * 进一步分析符号
 */
const Syn_SegMore =
  Syn_Sbj +
  Syn_Obj +
  Syn_CC_PVT +
  Syn_CC_SER +
  Syn_CC_SYN +
  Syn_CC_Uni_L +
  Syn_CC_Uni_R +
  Syn_CC_Coo_L +
  Syn_CC_Coo_R +
  Syn_CC_App_L +
  Syn_CC_App_R;

/**
 * NP结构中的虚词
 */
const Syn_NP_Vir = Syn_PP + Syn_FF + Syn_UN_L + Syn_UN_R;

const Syn_Left = {};
Syn_Left[XmlTags.C_Ding] = Syn_Att_L;
Syn_Left[XmlTags.C_Zhuang] = Syn_Adv_L;
Syn_Left[XmlTags.C_Bu] = Syn_Cmp_L;
Syn_Left[XmlTags.C_Ind] = Syn_Ind_L;

const Syn_Right = {};
Syn_Right[XmlTags.C_Ding] = Syn_Att_R;
Syn_Right[XmlTags.C_Zhuang] = Syn_Adv_R;
Syn_Right[XmlTags.C_Bu] = Syn_Cmp_R;
Syn_Right[XmlTags.C_Ind] = Syn_Ind_R;

const Syn_Pair = {};
Syn_Pair[Syn_Att_L] = Syn_Att_R;
Syn_Pair[Syn_Adv_L] = Syn_Adv_R;
Syn_Pair[Syn_Cmp_L] = Syn_Cmp_R;
Syn_Pair[Syn_Ind_L] = Syn_Ind_R;
Syn_Pair[Syn_Lift_L] = Syn_Lift_R;

//--词法--
const Lex_BL = '…';
const Lex_DZ = '↗';
const Lex_ZZ = '→';
const Lex_SB = '←';
const Lex_DB = '｜'; // U+FF5C
const Lex_ZW = '‖'; // U+2016
const Lex_QT = '-';
const Lex_CD = '·';
const Lex_FC = '◇';

const Lex_ALL =
  Lex_QT +
  Lex_BL +
  Lex_DZ +
  Lex_ZZ +
  Lex_SB +
  Lex_DB +
  Lex_ZW +
  Lex_CD +
  Lex_FC; //Lex_QT特殊符号，需放首位

export default {
  Default,

  //--句法--
  Syn_Sbj,
  Syn_Sbj_L,
  Syn_Obj,
  Syn_Obj_R,
  Syn_Att_L,
  Syn_Att_R,
  Syn_Adv_L,
  Syn_Adv_R,
  Syn_Cmp_L,
  Syn_Cmp_R,
  Syn_Ind_L,
  Syn_Ind_R,
  Syn_FF,
  Syn_PP,
  Syn_PP_L,
  Syn_CC_L,
  Syn_CC_R,
  Syn_CC_Uni1_L,
  Syn_CC_Uni1_R,
  Syn_CC_Uni_L,
  Syn_CC_Uni_R,
  Syn_CC_Coo1_L,
  Syn_CC_Coo1_R,
  Syn_CC_Coo_L,
  Syn_CC_Coo_R,
  Syn_CC_App_L,
  Syn_CC_App_R,
  Syn_CC_PVT,
  Syn_CC_SER,
  Syn_CC_SYN,
  Syn_UU_L,
  Syn_UU_R,
  Syn_UN_L,
  Syn_UN_R,
  Syn_UV_L,
  Syn_UV_R,
  Syn_Lift_L,
  Syn_Lift_R,
  Syn_Lift_M,
  Syn_All,
  Syn_No_UU,
  Syn_No_Vir1,
  Syn_Additives_L,
  Syn_Additives_R,
  Syn_Brackets_L,
  Syn_Brackets_R,
  Syn_PrdLayMark,
  Syn_SegMore,
  Syn_NP_Vir,
  Syn_Left,
  Syn_Right,
  Syn_Pair,

  //--词法--
  Lex_BL,
  Lex_DZ,
  Lex_ZZ,
  Lex_SB,
  Lex_DB,
  Lex_ZW,
  Lex_QT,
  Lex_CD,
  Lex_FC,
  Lex_ALL,
};
