const PunctuationRegex = "[。？！，：；、…—‘’“”＂〈〉《》「」『』〖〗【】（）［］｛｝／~\\\\'\".!,:;=\\?\\(\\)\\[\\]]"; //\\{\\}
const SpaceBefore = "(?<=" + PunctuationRegex + ")(?![.…—~ ])";
const SpaceAfter = "(?<![.…—~ ])(?=" + PunctuationRegex + ")";
const SplitPuncRegex =
  /(?:(?<=[\.。？！?!]|……)(?![。？！?!…，”’」』）)])|(?<=[。？！?!…—][”’」』）)]+)(?![”’”’」』）)])|(?<=\D[：:￱]))\s*/;
const EndWithSplitPuncRegex = new RegExp("(?:" + SplitPuncRegex.source + ")$");

const ModMarkRegex = "[^a-z\\d]";

const AnnoMarkRegex = "〔\\d+.\\d+〕";

const CooSepRegex = "(?:[和与或跟同]|以及|及|以至|乃至|甚至|至)(?!.*[、，和与或跟同及至].)";
const UniSepRegex = "[而或和并则以](?!.*[而或和并则以])";
const AutoConjunct_COO = "和|与|或者|或|跟|同|至|到|乃至|以及|以至|及其(?![他它])|及|并";
const AutoConjunct_APP = "即|特别是|尤其是";
const AutoConjunct_UNI = "还是|而且|而|或者|或|与|和|并且|并|且|则|以";

const R6Regex = "自己|这|那";
const V4Regex =
  "不许|令|伏侍|传|伺候|使|剩|劝|叫|吩咐|命|唤|嘱咐|嫌|带|帮助|引|打发|托|扶|抱怨|拉|放|教|无|有" +
  "|欢迎|求|没|没有|派|留|祝|称|给|罚|要求|让|请|送|逼|陪|需要|领";

const DirectVRegex = "(?:[上下进出回过开起][来去]|[上下进出回过开起来去])";
const TWordRegex =
  "^[\\d零○〇一二三四五六七八九十]{2,4}(年|世纪|年代)$|^[\\d一二三四五六七八九十]{1,3}(?:[月日时分秒]|点钟)$";
const MWordRegex =
  "^[\\d０-９.]+%?$|^第?[\\d０-９零○〇一二三四五六七八九十百千万亿几两]+$|^[零一二三四五六七八九十百千万亿]+分之[零一二三四五六七八九十百千万亿]+(点[零一二三四五六七八九]+)?$";

const ZhanWei = "￱"; // 占位符号

const GridMaxCol = 999; //需要与quasar.variables.scss中$grid-max-col变量一致
const ArcMarginLeft = 45; // 依存关系句子左边留白

const DefaultStartCol = 2;
const BuStartCol = 3;

export default {
  PunctuationRegex,
  SpaceBefore,
  SpaceAfter,
  SplitPuncRegex,
  EndWithSplitPuncRegex,

  CooSepRegex,
  UniSepRegex,
  AutoConjunct_COO,
  AutoConjunct_APP,
  AutoConjunct_UNI,

  R6Regex,
  V4Regex,

  DirectVRegex,
  TWordRegex,
  MWordRegex,

  ZhanWei,
  AnnoMarkRegex,
  ModMarkRegex,
  GridMaxCol,
  ArcMarginLeft,
  DefaultStartCol,
  BuStartCol,
};
