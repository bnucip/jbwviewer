import XmlTags from '../api/xml_tags';

const Default = {};
const Fold = {};
const Unfold = {};

Default[XmlTags.C_Ding] = 'att-sep';
Default[XmlTags.C_Zhuang] = 'adv-sep';
Default[XmlTags.C_Bu] = 'cmp-sep';
Default[XmlTags.C_Ind] = 'ind-sep';
Default[XmlTags.C_Zhu] = 'fill-lifter';
Default[XmlTags.C_Wei] = 'fill-lifter';
Default[XmlTags.C_Bin] = 'fill-lifter';

const Default_Subs = [
  Default[XmlTags.C_Ding],
  Default[XmlTags.C_Zhuang],
  Default[XmlTags.C_Bu],
  Default[XmlTags.C_Ind],
];

Fold[XmlTags.C_Ding] = 'att-sep-fold';
Fold[XmlTags.C_Zhuang] = 'adv-sep-fold';
Fold[XmlTags.C_Bu] = 'cmp-sep-fold';
Fold[XmlTags.C_Ind] = 'ind-sep-fold';
Fold[XmlTags.C_Zhu] = 'fill-lifter-fold';
Fold[XmlTags.C_Wei] = 'fill-lifter-fold';
Fold[XmlTags.C_Bin] = 'fill-lifter-fold';

Unfold[XmlTags.C_Ding] = 'att-sep-unfold';
Unfold[XmlTags.C_Zhuang] = 'adv-sep-unfold';
Unfold[XmlTags.C_Bu] = 'cmp-sep-unfold';
Unfold[XmlTags.C_Ind] = 'ind-sep-unfold';
Unfold[XmlTags.C_Zhu] = 'fill-lifter-unfold';
Unfold[XmlTags.C_Wei] = 'fill-lifter-unfold';
Unfold[XmlTags.C_Bin] = 'fill-lifter-unfold';

const All = {};
All[XmlTags.C_Ding] = [
  Default[XmlTags.C_Ding],
  Fold[XmlTags.C_Ding],
  Unfold[XmlTags.C_Ding],
];
All[XmlTags.C_Zhuang] = [
  Default[XmlTags.C_Zhuang],
  Fold[XmlTags.C_Zhuang],
  Unfold[XmlTags.C_Zhuang],
];
All[XmlTags.C_Bu] = [
  Default[XmlTags.C_Bu],
  Fold[XmlTags.C_Bu],
  Unfold[XmlTags.C_Bu],
];
All[XmlTags.C_Ind] = [
  Default[XmlTags.C_Ind],
  Fold[XmlTags.C_Ind],
  Unfold[XmlTags.C_Ind],
];
All[XmlTags.C_Zhu] = [
  Default[XmlTags.C_Zhu],
  Fold[XmlTags.C_Zhu],
  Unfold[XmlTags.C_Zhu],
];
All[XmlTags.C_Wei] = [
  Default[XmlTags.C_Wei],
  Fold[XmlTags.C_Wei],
  Unfold[XmlTags.C_Wei],
];
All[XmlTags.C_Bin] = [
  Default[XmlTags.C_Bin],
  Fold[XmlTags.C_Bin],
  Unfold[XmlTags.C_Bin],
];

export default {
  Default,
  Default_Subs,
  Fold,
  Unfold,
  All,
};
