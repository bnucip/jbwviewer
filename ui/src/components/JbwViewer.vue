<template>
  <div>JbwView22er111</div>
</template>

<script>
import JbwViewer222 from './JbwViewer222.vue';
import { onMounted, getCurrentInstance } from 'vue';

export default {
  name: 'JbwViewer',
  extends: JbwViewer222,
  setup(props, ctx) {
    const { proxy } = getCurrentInstance();
    onMounted(() => {
      console.log(proxy, proxy.abc, 456);
    });

    return { ...JbwViewer222.setup(props, ctx) };
  },
};
</script>