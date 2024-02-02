<template>
  <div class="bg-white">
    <q-item dense clickable class="chapter-label" :title="chapterTitle">
      <q-item-label lines="1" class="q-pt-sm" style="font-size:12px;">
        {{ chapterLabel }}
      </q-item-label>
    </q-item>

    <q-list bordered separator>
      <q-item dense clickable class="q-pa-sm" :key="item.sentId" v-bind="item" active-class="sent-active"
              @click="onClick(item)" v-for="(item, index) in items">
        <q-item-section>
          <q-item-label lines="1" :title="item.content">
            <span class="sent-index">{{ index + 1 }}</span>.<span
                  :class="item.stateClass">{{ item.content }}</span>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from 'vue';
const { proxy } = getCurrentInstance();
const chapterTitle = ref('');
const chapterLabel = ref('');
const items = ref([]);

const mainCom = computed(() => {
  return proxy.ancestor('MyLayout');
});

const onClick = (item) => {
  let main = mainCom.value;
  // activeItem.value = item;
  // console.log(main);
  if (main && main.rView) {
    main.rView.loadElectronXml(item.xmlStr, item.sentIds);
  }
};

defineExpose({ items });
</script>

<style lang="scss">
.check-input.q-field--dense .q-field__control {
  height: 30px;
}
</style>

<style lang="scss" scoped>
.sent-active {
  background-color: $primary;
  color: inherit;

  .sent-index {
    color: white;
  }
}

.chapter-label {
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 3px;
  margin: 3px 0px 2px 1px;
}

.sect-grid {
  display: grid;
  grid-template-columns: 100px 500px;
}

.item-select {
  background: #d7ebff;
  outline: 1px solid #a3c5e8;
  color: #666;
}
</style>
