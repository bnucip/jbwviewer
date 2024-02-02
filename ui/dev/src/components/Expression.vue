<template>
  <div class="exp-sent" :data-atop="atop" :data-coh="coh" :style="'margin-left:' + ml + 'px;'">
    {{ content }}
  </div>
</template>
<script>
import { computed, getCurrentInstance } from 'vue';

export default {
  name: 'Expression',
  props: {
    align: String, // 对齐文字
    atop: {
      type: Number, // 0-居中 1-向上对齐 -1-向下对齐
      default: 0,
    },
    coh: String, // 对齐线条符号
    font: String, // 对齐文字的字体，用于计算宽度
    content: String,
  },
  setup(props) {
    const { proxy } = getCurrentInstance();
    const ml = computed(() => {
      let wd = props.align.pxWidth(props.font);
      return wd;
    });

    return { ml };
  },
};
</script>

<style lang="scss" scoped>
.exp-sent {
  position: relative;
}

.exp-sent::before {
  content: attr(data-coh);
  color: red;
  position: absolute;
}
.exp-sent[data-atop='1']::before {
  left: -5px;
  top: -15px;
}
.exp-sent[data-atop='0']::before {
  left: -20px;
  top: -1px;
}
.exp-sent[data-atop='-1']::before {
  left: -5px;
  bottom: -15px;
}
.exp-sent[data-coh='↱']::before {
  left: -14px;
  top: 5px;
}
.exp-sent[data-coh='↳']::before,
.exp-sent[data-coh='ᒪ']::before {
  left: -14px;
  top: -6px;
}
</style>
