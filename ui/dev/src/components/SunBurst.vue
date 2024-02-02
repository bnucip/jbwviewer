<template>
  <v-chart v-if="show" class="chart prevented" :style="{ left: mouse.left + 'px', top: mouse.top + 'px' }"
           ref="vchart" :option="option" @mouseup="onMouseUP" />
</template>

<script>
import { GridUtil, XmlTags, UniPos } from 'jbw-viewer';
import { use } from 'echarts/core';
import { SunburstChart, PieChart } from 'echarts/charts';
import { SVGRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from 'vue-echarts';

use([[SunburstChart, PieChart, SVGRenderer]]);

import {
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
} from 'src/model/data_sunburst';

export default {
  name: 'SunBurst',
  components: {
    VChart,
  },
  props: {
    show: Boolean,
    editor: Object,
  },
  provide: {
    // [THEME_KEY]: "dark"
  },
  data() {
    return {
      seriesIndex: 0,
      dataIndex: 0,
      selectedData: null,
      mouse: {
        left: 0,
        top: 0,
      },
      option: {
        animation: false,
        series: [
          {
            type: 'pie',
            roseType: 'area',
            data: pieData1,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: innerItemStyle,
            radius: innerRadius,
            label: innerLabel,
            startAngle: 15,
          },
          {
            type: 'pie',
            roseType: 'area',
            data: pieData2,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: innerItemStyle,
            label: innerLabel,
            radius: innerRadius,
            startAngle: 75,
          },
          {
            type: 'pie',
            roseType: 'area',
            data: pieData3,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: innerItemStyle,
            label: innerLabel,
            radius: innerRadius,
            startAngle: -15,
          },
          {
            type: 'pie',
            roseType: 'area',
            data: pieData4,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: outerItemStyle,
            label: outerLabel,
            radius: outerRadius,
            startAngle: 15,
          },
          {
            type: 'pie',
            roseType: 'area',
            data: pieData50,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: outerItemStyle,
            label: outerLabel,
            radius: outerRadius,
            startAngle: 15,
          },
          {
            type: 'pie',
            roseType: 'area',
            data: pieData6,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: outerItemStyle,
            label: outerLabel,
            radius: outerRadius,
            startAngle: -15,
          },
          {
            type: 'pie',
            roseType: 'area',
            data: pieData7,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: outerItemStyle,
            label: outerLabel,
            radius: outerRadius,
            startAngle: -105,
          },
          {
            type: 'pie',
            roseType: 'area',
            showEmptyCircle: false,
            data: pieData8,
            emphasis: {
              itemStyle: emphasisItemStyle,
            },
            itemStyle: outerItemStyle,
            label: outerLabel,
            radius: outerRadius,
            startAngle: 165,
          },
        ],
      },
    };
  },
  methods: {
    onMouseUP: function (params) {
      let editor = this.$parent.$parent;
      console.log(params, this.$parent, editor);
      if (editor != null) {
        editor.showFlag = false;
        editor.acFocus();
      }

      if (params.data.label) {
        // let cp = params.data.colPosition == undefined ? 0 : params.data.colPosition;
        // if (editor != null) editor.addComponent(params.data.label, cp);
        if (editor != null) editor.addComponent(params.data.method, params.data.label, params.event.event);
      }

      params.event.event.preventDefault(); // 防止点击穿透到下面元素
    },

    onTouchEnd(e) {
      // console.log(e);
      let editor = this.editor;
      if (editor != null) {
        editor.showFlag = false;
        editor.acFocus();
      }

      if (this.selectedData == null) return;
      if (this.selectedData.label) {
        if (editor != null) editor.addComponent(this.selectedData.method, this.selectedData.label, e);
      }
      this.selectedData = null;
    },

    highLight(e) {
      let touch = e.changedTouches[0];
      let elems = document.elementsFromPoint(touch.clientX, touch.clientY);
      let path = elems.find((o) => o.tagName == 'path');
      let vchart = this.$refs.vchart;

      if (this.selectedData != null) {
        this.selectedData = null;

        if (vchart != null)
          // 取消之前高亮的图形
          vchart.dispatchAction({
            type: 'downplay',
            seriesIndex: this.seriesIndex,
            dataIndex: this.dataIndex,
          });
      }
      // console.log(path);
      if (path == null) return;

      // 注意：echarts版本升级后，d属性可能会变化
      let d = path.getAttribute('d');
      // 外弧线逆时针顶点
      let mm = d.match(/M(\d+)\.?\d* (\d+)\.?\d*/);
      // 外弧线顺时针顶点
      let am = d.match(/A\d+ \d+ \d+ \d+ \d+ (\d+)\.\d+ (\d+)\.\d+/);
      // 内弧线顺时针顶点
      let lm = d.match(/L(\d+)\.?\d* (\d+)\.?\d*/);
      // console.log(mm);
      // console.log(am);
      // console.log(lm);
      if (mm == null || am == null || lm == null || mm.length != 3 || lm.length != 3 || am.length != 3) return;

      let mx = parseInt(mm[1]),
        my = parseInt(mm[2]),
        ax = parseInt(am[1]),
        ay = parseInt(am[2]),
        lx = parseInt(lm[1]),
        ly = parseInt(lm[2]);
      // 1. 找出光标所在成分的矩形，计算出中心点位置(cx,cy)
      let x1 = Math.min(mx, lx, ax),
        x2 = Math.max(mx, lx, ax),
        y1 = Math.min(my, ly, ay),
        y2 = Math.max(my, ly, ay);
      let cx = (x1 + x2) / 2;
      let cy = (y1 + y2) / 2;
      // console.log("x:" + x1 + "\tx2:" + x2 + "\ty:" + y1 + "\tx2:" + y2);
      // 2. 提取出矩形内<text>标签里的文本
      let t = '';
      let texts = vchart.$el.getElementsByTagName('text');
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        let translates = document.defaultView.getComputedStyle(text, null).transform;
        let axis = translates.substring(6).split(','); // 总共6个元素 4-x 5-y
        // console.log(axis);
        // if (text.innerHTML == "状语") console.log(axis);
        if (axis.length == 6) {
          let ax = parseFloat(axis[4]);
          let ay = parseFloat(axis[5]);
          let distance = Math.sqrt(Math.pow(cx - ax, 2) + Math.pow(cy - ay, 2));
          // console.log(distance);
          // 2.1通过文本点与中心点的距离判断
          if (distance < 42) {
            t += text.innerHTML.trim();
          }
        }
      }

      // 3.根据文本反推出option.series所对应的data
      if (t != '') {
        // console.log(t);
        let series = this.option.series;
        for (let si = 0; si < series.length; si++) {
          const serie = series[si];
          for (let di = 0; di < serie.data.length; di++) {
            const sd = serie.data[di];
            if (sd.name == null) continue;
            if (sd.name.replace(/\r\n/, '') == t) {
              this.seriesIndex = si;
              this.dataIndex = di;
              this.selectedData = sd;
              // 高亮当前图形
              vchart.dispatchAction({
                type: 'highlight',
                seriesIndex: this.seriesIndex,
                dataIndex: this.dataIndex,
              });
              return;
            }
          }
        }
      }
    },
  },
  watch: {
    show: function (newVal, oldVal) {
      if (newVal && window.event) {
        if (window.event.type == 'touchmove') {
          //移动端
          let touch = window.event.changedTouches[0];
          this.mouse.left = touch.clientX - 320;
          this.mouse.top = touch.clientY - 320;
        } else {
          this.mouse.left = window.event.clientX - 320;
          this.mouse.top = window.event.clientY - 320;
        }

        // console.log(this);
        let editor = this.getEditor();
        if (editor == null) return;
        let compt = editor.activeComponent;
        if (compt == null) return;

        let series = this.option.series;
        // 调整图形展示
        switch (compt.iniType) {
          case XmlTags.C_Zhu:
            series[0].data[9] = prd;
            series[4].data = pieData52;
            series[5].data[3] = un1;
            series[6].data[3] = un2;
            series[7].data = [];
            break;
          case XmlTags.C_Wei:
            series[0].data[9] = prd;
            series[4].data = pieData51;
            series[5].data[3] = uv1;
            series[6].data[3] = uv2;
            series[7].data = [];
            break;
          case XmlTags.C_Bin:
            series[0].data[9] = prd;
            let leftPrd = compt.nearestLeftCompt(XmlTags.C_Wei);
            let nrc = compt.nearestRightCompt();
            series[4].data =
              leftPrd != null &&
              [UniPos.LAST, UniPos.ONLY].contains(GridUtil.posInUni(compt)) &&
              (!nrc || !nrc.belongIniType(XmlTags.C_FF, XmlTags.C_UN, XmlTags.C_UV))
                ? pieData50
                : pieData52;
            series[5].data[3] = un1;
            series[6].data[3] = un2;
            series[7].data = [];
            break;
          default:
            series[0].data[9] =
              (compt.belongIniType(XmlTags.O_Temp) &&
                compt.parentCompt.belongIniType(XmlTags.C_Ding, XmlTags.C_Zhuang, XmlTags.C_Bu)) ||
              compt.belongIniType(XmlTags.C_CC)
                ? split
                : prd;
            series[4].data = pieData50;
            series[5].data[3] = empty;
            series[6].data[3] = empty;
            series[7].data = pieData8;
            break;
        }

        // console.log(window.event)
        // console.log(newVal)
      }
    },
  },
  updated() {
    // this.$el.addEventListener('mousedown', event => event.preventDefault());
  },
};
</script>

<style scoped>
.chart {
  align-items: center;
  justify-content: center;
  z-index: 9999 !important;
  position: fixed;
  width: 640px;
  height: 640px;

  /* margin-top: -200px; */
  /* margin: -150px; */
  /* height: 400px;
  width: 400px; */
}
</style>