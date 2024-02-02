<template>
  <div>JbwViewer222</div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'JbwViewer222',
  setup() {
    const abc = ref(123);

    onMounted(() => {
      console.log(222);
    });
    return { abc };
  },
};
</script>