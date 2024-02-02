<template>
  <div class="diagram-area" ref="diagramDiv" style="min-height: calc(100vh - 55px)">
    <JbwViewer ref="viewer" :editor="this" :parentDiv="diagramDiv" />

    <q-dialog v-model="showXmlPopup">
      <div class="xml-popup-grid bg-grey-4">
        <div class="q-mt-md q-mr-lg" style="grid-area: 1 / 1 / 2 / 3;">
          <q-btn class="float-right" color="info" label="关闭" padding="2px 10px" dense v-close-popup />
          <q-btn class="q-mr-sm float-right" color="info" padding="2px 10px" label="加载"
                 @click="()=>loadXml()" />
        </div>
        <div class="exp-info">
          <div>基础句式：　〖独〗﹙定﹚主║﹝状﹞谓﹤补﹥｜宾　并列⠤⠄　同位≔≕　介∧　⠉连⠁　△▽▷助◁▲▼　□方</div>
          <div>复杂句式：　联合⠒⠂　连动／　兼语⫽　合成∶　﹛主‖谓﹜</div>
          <div>复句句群：　语义关联ᒪ　结构衔接⋮　句末插说⫰</div>
        </div>
        <div class="xml-area bg-white" ref="xmlArea" @input="xmlAreaInput" contenteditable="true">
        </div>
        <div class="exp-area" ref="expArea">
          <expression v-bind="item" v-for="(item,idx) in expItems" :key="idx" />
        </div>
        <div class="row items-center q-px-md" style="grid-area: 3 / 2 / 4 / 3">
          <div class="col-auto">分析层次</div>
          <q-slider class="col q-mx-md" v-model="layer" :min="0" :max="maxLayer" :step="1" snap markers label
                    label-always @change="layerSilderChange" />
          <q-checkbox class="col-auto" v-model="chkPrune" label="剪枝" />
          <q-checkbox class="col-auto" v-model="chkWithPos" label="带词性" />
          <q-checkbox class="col-auto q-mr-lg" v-model="chkSplitDynWord" label="拆动态词" />
        </div>
      </div>
    </q-dialog>
  </div>
</template>
<script setup>
import { onMounted, ref, nextTick, computed, getCurrentInstance, watch } from 'vue';
import { ExprConverter, XmlTags } from 'jbw-viewer';
import { xmls } from 'src/model/test_data';
import Expression from '../components/Expression.vue';
import vkbeautify from 'vkbeautify';
import { useQuasar, Loading, QSpinnerIos } from 'quasar';

const { proxy } = getCurrentInstance();
const $q = useQuasar();

const xml = ref();
xml.value = xmls[1];
const diagramDiv = ref();
const viewer = ref();

const showXmlPopup = ref(false); // 展示XML弹窗
const xmlArea = ref(null); // 弹窗里展示XML的div
const expArea = ref(null); // 弹窗里展示句式表达式的div
const expItems = ref([]); // 弹窗里展示句式表达式列表
const layer = ref(0); // 弹窗里当前分析层数
const maxLayer = ref(0); //弹窗里最大分析层数
const chkPrune = ref(false); // 是否剪枝
const chkWithPos = ref(false); // 是否带词性
const chkSplitDynWord = ref(false); // 是否拆动态词

const expAreaFont = computed(() => {
  return expArea.value != null ? window.getComputedStyle(expArea.value).font : null;
});

onMounted(async () => {
  await viewer.value.decodeXml(xml.value.toXml());
});

// 返回当前图形XML字符
const copyXml = () => {
  showXmlPopup.value = true;
  if (!viewer.value) return '';

  let xj = viewer.value.encodeXml();
  let xmlString;
  // IE
  if (window.ActiveXObject) {
    xmlString = xj.xml;
  }
  // code for Mozilla, Firefox, Opera, etc.
  else {
    xmlString = new XMLSerializer().serializeToString(xj);
  }
  xmlString = vkbeautify.xml(xmlString, 2);
  nextTick(() => {
    xmlArea.value.innerText = xmlString;
    // getExpression(xmlString);
    getLayerExpression(true);
  });
  return xmlString;
};

const getLayerExpression = (setMax = false) => {
  if (!xmlArea.value) return;

  // 去除空格和换行
  let text = vkbeautify.xmlmin(xmlArea.value.innerText);
  // console.log(text);
  let xmlDoc = text.toXml();
  if (!xmlDoc) {
    // proxy.qAlert('XML格式错误！');
    return;
  }
  getExpression(xmlDoc, setMax);
};

// 层次改变
const layerSilderChange = (v) => {
  getLayerExpression();
};
watch([chkPrune, chkWithPos, chkSplitDynWord], () => {
  getLayerExpression();
});

const getExpression = (xml, setMax) => {
  expItems.value.length = 0;
  let dw = chkSplitDynWord.value ? '' : null;
  let exprs = ExprConverter.getAllClauseExprs(xml, chkPrune.value, chkWithPos.value, dw);
  // console.log(exprs);
  let max = 0;
  for (const key in exprs) {
    if (Object.hasOwnProperty.call(exprs, key)) {
      const element = exprs[key];
      if (max < element.length) max = element.length;
      if (setMax) layer.value = maxLayer.value;
      let idx = setMax || layer.value >= element.length ? element.length - 1 : layer.value;
      expItems.value.push({
        align: '',
        // coh: exp.coh,
        // atop: exp.aTop,
        font: expAreaFont.value,
        content: element[idx],
      });
    }
  }
  maxLayer.value = max - 1;
  if (setMax || layer.value > maxLayer.value) layer.value = maxLayer.value;
};

// 加载xmlArea区域数据到图形
const loadXml = (inXml) => {
  // console.log(inXml);
  let xmlDoc = inXml ? inXml : xmlArea.value.innerText.toXml();
  if (!xmlDoc) {
    $q.notify('XML格式错误！');
    return;
  }
  if (viewer.value != null) {
    Loading.show({ spinner: QSpinnerIos, message: '加载中…' });
    // 添加延时，等待Loading加载
    setTimeout(async () => {
      if (proxy.$isElectron && xmlDoc.nameIs(XmlTags.C_Para)) {
        // sentIds.value = xmlDoc.elements().map((o) => parseInt(o.getAttribute(XmlTags.A_Id)));
      }

      viewer.value.clearLine();
      await nextTick();
      await viewer.value.decodeXml(xmlDoc);
      Loading.hide();
    }, 100);
  }
  showXmlPopup.value = false;
};

const loadElectronXml = (xml, _sentIds) => {
  if (xml) {
    // Loading.show({ spinner: QSpinnerIos, message: "加载中…" });
    // sentIds.value = _sentIds;
    loadXml(xml.toXml());
  }
};

defineExpose({ copyXml, viewer, loadElectronXml });
</script>
<style lang="sass" scoped>
.directive-target
  width: 50px
  height: 50px

.diagram-area
  overflow: auto
  // border: 1px solid grey
  // background-color: $grey-1
  margin: 1px

.xml-popup-grid
  width: 80vw
  max-width: 80vw
  height: 85vh

  display: grid
  grid-template-rows: 90px 1fr 60px
  grid-template-columns: 350px 1fr

.xml-area
  grid-area: 2 / 1 / 4 / 2
  margin-left: 20px
  height: 70vh
  outline: 1px grey groove
  overflow: auto
  white-space: pre-wrap

.xml-area:focus,
.xml-area:hover,
.exp-area:hover
  outline: 2px skyblue groove

.exp-info
  grid-area: 1 / 1 / 2 / 3
  padding: 16px 0px 16px 16px
  font-size: 16px

.exp-area
  grid-area: 2 / 2 / 3 / 3
  overflow: auto
  // white-space: nowrap;
  margin: 0px 20px 0px 5px
  padding: 10px
  width: 53vw
  outline: 1px grey groove
  font-size: 20px
</style>
