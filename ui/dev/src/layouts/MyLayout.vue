<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <!-- <q-btn flat dense round to="/" icon="home" /> -->
        <q-btn flat dense round icon="home" />
        <q-toolbar-title>
          jbw-viewer v{{ version }}
        </q-toolbar-title>
        <q-btn round flat class="q-ml-sm" icon="wallpaper" @click="showHelp = true" />
        <template v-if="$isElectron">
          <q-btn flat dense class="bg-light-blue-4 q-ml-sm" icon="upload_file" @click="openFile" />
        </template>
        <q-btn flat dense class="bg-light-blue-4 q-ml-sm" label="XML" @click="openXMLDialog" />
        <q-btn round flat class="q-ml-sm" title="关于" icon="help" @click="showAbout = true" />
        <!-- <div>Quasar v{{ $q.version }}</div> -->
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above bordered :breakpoint="700" :width="155">
      <router-view name="sentinfo" v-slot="{ Component }">
        <component ref="sentInfo" :is="Component" />
      </router-view>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <component ref="rView" :is="Component" />
      </router-view>
    </q-page-container>

    <q-dialog v-model="showHelp">
      <help-figure class="q-py-lg q-pr-lg q-pl-xl bg-white" style="width:1000px;max-width:80vw;" />
    </q-dialog>
    <q-dialog v-model="showAbout">
      <q-card style="width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">关于</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <p>Email: <a href="mailto:pengweiming@bnu.edu.cn">pengweiming@bnu.edu.cn</a></p>
          <a href="http://www.jubenwei.com" target="_blank">http://www.jubenwei.com</a>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { version, XmlTags } from 'jbw-viewer'; // "jbw-viewer" is aliased in quasar.conf.js
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { examples } from 'src/model/test_data';
import HelpFigure from 'src/components/HelpFigure.vue';

const rView = ref();
const $q = useQuasar();
const sentInfo = ref();
const showHelp = ref(false);
const showAbout = ref(false);

// vue 3.3
defineOptions({
  name: 'MyLayout',
});

defineExpose({ rView });

watch(sentInfo, (nv) => {
  if (nv) {
    sentInfo.value.items = examples;
  }
});

const openFile = () => {
  window.mainSizeWinApi?.openFile((content) => {
    // console.log(typeof content, content);
    if (!content) {
      return;
    }
    let xmlDoc = content.toXml();
    if (!xmlDoc) {
      $q.notify('XML格式错误！');
      return;
    }

    if (!sentInfo.value) {
      return;
    }

    let sentItems = [];
    let elems = xmlDoc.nameIs(XmlTags.X_Jbw) ? xmlDoc.elements() : xmlDoc.elements().descendantsAndSelf(XmlTags.C_Para);
    // console.log(xmlDoc);
    // console.log(elems);
    elems.forEach((el, idx) => {
      let sentIds;
      if (el.nameIs(XmlTags.C_Para)) {
        sentIds = [];
        el.elements().forEach((te) => {
          sentIds.push(parseInt(te.getAttribute(XmlTags.A_Id)));
        });
      }
      sentItems.push({
        content: el.textContent.removeSpace(),
        xmlStr: el.toPlainString(),
        sentIds: sentIds,
      });
    });
    // console.log(sentInfo.value, sentItems);
    sentInfo.value.items = sentItems;
  });
};
const openXMLDialog = () => {
  rView.value?.copyXml?.();
};
</script>
