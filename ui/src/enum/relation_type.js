// 并列关系
const Coordinate = ["承接", "并列", "选择", "递进", "转折"];
// 主从关系
const MainSub = ["时间", "因果", "假设", "条件", "让步"];

const Default = "承接";
const ArrowType = "导语";
const ArrowSym = "⤹";
// 顺承话题
const TopicSbj = "承主";
const TopicObj = "续宾";
const Topic1 = [TopicSbj, TopicObj];
// 顺承话题符号
const Topic1Sym = ["＋", "－"];
//
const TopicSent = "接句";
// 解说话题
const Topic2 = [ArrowType];
// 话题
const Topic = ["承主", "续宾", "接句", "承导", ArrowType];
// 话题
const TopicSym = ["＋", "－", "±", "⤷", ArrowSym];

const RelSymDict = {
  并列: "⦉",
  选择: "⦉",
  递进: "⦉",
  转折: "ᔭ",
  承接: "ᒪ",
  承主: "＋",
  续宾: "－",
  接句: "±",
  承导: "⤷",
  导语: ArrowSym,
};

export default {
  Coordinate,
  MainSub,
  TopicSbj,
  TopicObj,
  TopicSent,
  Topic1,
  Topic1Sym,
  Topic2,
  Topic,
  TopicSym,
  Default,
  ArrowSym,
  ArrowType,
  RelSymDict,
};
