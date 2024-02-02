<template>
  <div>
    <div :class="tbClass" ref="block">
      <span v-html="pos" ref="spanPos"></span><span :class="codeClass" ref="spanCode">{{ code }}</span><span
            class="mod-span" ref="mod">{{ mod }}</span>
    </div>
    <div v-html="textHtml" class="hid-text"></div>
  </div>
</template>

<script>
import { ref, defineComponent, watch } from 'vue';

export default defineComponent({
  name: 'TypeBlock',
  props: {
    text: {
      type: String,
      default: '',
    },
    pos: {
      type: String,
      default: 'x',
    },
    code: {
      type: String,
      default: '',
    },
    mod: {
      type: String,
      default: ' ',
    },
    active: {
      type: Boolean,
      default: false,
    },
    hideTb: {
      type: Boolean,
      default: false,
    },
    hideCode: {
      type: Boolean,
      default: false,
    },
    // 锁定或编辑状态
    lock: {
      type: Boolean,
      default: false,
    },
  },

  setup(props) {
    const spanPos = ref();
    const spanCode = ref();

    const tbClass = ref('type-block');
    watch(
      () => props.hideTb,
      (nv) => {
        tbClass.value = nv ? 'type-block-hidden' : 'type-block';
      }
    );

    const codeClass = ref('code-span');
    watch(
      () => props.hideCode,
      (nv) => {
        codeClass.value = nv ? 'code-span-hidden' : 'code-span';
      }
    );

    watch(
      () => props.lock,
      (nv) => {
        if (nv) {
          spanPos.value.style.fontWeight = 'bolder';
          spanCode.value.style.fontWeight = 'bolder';
        } else {
          spanPos.value.style.fontWeight = 'normal';
          spanCode.value.style.fontWeight = 'normal';
        }
      }
    );

    return { tbClass, codeClass, spanPos, spanCode };
  },

  computed: {
    charNum: function () {
      return this.text.trim().length;
    },

    //替换为html空格的文本
    textHtml: function () {
      return this.text.replace(/ /g, '&nbsp;');
    },
  },

  methods: {
    setPos: function (val, word) {
      // this.pos = val
      this.setPosColor(val, word);
    },

    setPosColor(pos, text) {
      this.$nextTick(() => {
        // console.log(this.$refs);
        if (pos == 'x' && text != '') this.$refs.spanPos.style.color = 'red';
        else this.$refs.spanPos.style.color = 'black';
      });
    },
  },

  watch: {
    active: {
      handler(newVal) {
        this.$nextTick(() => {
          if (newVal) {
            this.$refs.spanPos.style.fontWeight = 'bold';
            this.$refs.spanCode.style.fontWeight = 'bold';
            this.$refs.block.style.borderBottomColor = 'orangered';

            if (this.pos == '&nbsp;' || this.pos == ' ') {
              this.$refs.block.style.width = '0px';
              this.$refs.block.style.minWidth = '0px';
            } else {
              this.$refs.block.style.width = 'fit-content';
              this.$refs.block.style.minWidth = '8px';
            }
          } else {
            this.$refs.spanPos.style.fontWeight = 'normal';
            this.$refs.spanCode.style.fontWeight = 'normal';
            this.$refs.block.style.borderBottomColor = 'transparent';
          }
        });
      },
      immediate: true,
    },

    pos: function (newVal) {
      this.setPosColor(newVal, this.text);
    },

    text: function (newVal) {
      this.setPosColor(this.pos, newVal);
    },

    code: {
      handler(newVal) {
        let cssText = '';
        if (newVal == '') {
          cssText = 'margin-left: 0px;max-width: 13px;';
        } else {
          cssText += 'margin-left:-2px;';
          if (newVal.length > 3) cssText += 'max-width: 19px;';
          else cssText += 'max-width: 13px;';
        }
        this.$nextTick(() => {
          this.$refs.spanCode.style.cssText += cssText;
        });
      },
      immediate: true,
    },
  },
  mounted() {
    this.setPosColor(this.pos, this.text);
  },
});
</script>
