<template>
  <div>
    <div class="doc-card-title">基础句式</div>
    <div class="q-py-sm row justify-between items-center">
      <div class="col-auto"> <img style="width:505px;" src="~assets/image/help/jcjs.png" /></div>
      <q-separator vertical />
      <div class="col-auto column items-start">
        <div class="col row items-center">
          <span>并列</span>
          <img class="q-ml-md" style="width:99px;" src="~assets/image/help/bl.png" />
          <span class="q-ml-md">同位</span>
          <img class="q-ml-md" style="width:99px;" src="~assets/image/help/tw.png" />
        </div>
        <div class="col row items-center q-mt-sm">
          <span>虚词位</span>
          <img class="q-ml-md" style="width:30px;" src="~assets/image/help/jie.png" />
          <img class="q-ml-md" style="width:30px;" src="~assets/image/help/lian.png" />
          <img class="q-ml-md" style="width:30px;" src="~assets/image/help/zhu1.png" />
          <img class="q-ml-md" style="width:30px;" src="~assets/image/help/zhu2.png" />
          <img class="q-ml-md" style="width:30px;" src="~assets/image/help/fang.png" />
        </div>
      </div>
    </div>

    <div class="doc-card-title">复杂句式</div>
    <div class="q-py-sm column justify-between">
      <div class="col-auto row q-mt-sm">
        <div class="col column items-center">
          <img style="width:234px;" src="~assets/image/help/lhwy.png" />
          <span>联合谓语</span>
        </div>
        <div class="col column items-center">
          <img style="width:234px;" src="~assets/image/help/ldwy.png" />
          <span>连动谓语</span>
        </div>
        <div class="col column items-center">
          <img style="width:234px;" src="~assets/image/help/jywy.png" />
          <span>兼语谓语</span>
        </div>
      </div>
      <div class="col-auto row q-mt-sm">
        <div class="col column items-center justify-end">
          <img style="width:184px;" src="~assets/image/help/hcwy.png" />
          <span>合成谓语</span>
        </div>
        <div class="col flex items-center justify-center" style="font-size:28px;font-weight:bold;">
          句式结构图解公式
        </div>
        <div class="col column items-center justify-end">
          <img style="width:153px;" src="~assets/image/help/zwwy.png" />
          <span>主谓谓语</span>
        </div>
      </div>
    </div>

    <div class="doc-card-title">复句句群</div>
    <div class="q-pt-sm col row">
      <div class="col column items-center">
        <img style="width: 158px;" src="~assets/image/help/cfgx1.png" />
        <span>结构续合</span>
      </div>
      <div class="col column items-center">
        <img style="width: 165px;" src="~assets/image/help/fj.png" />
        <span>结构分立</span>
      </div>
      <div class="column q-py-md justify-between">
        <span>逻辑语义：主从（⇅时间、⇅因果、⇅假设、⇅条件、⇅让步）</span>
        <span>　　　　　等立（ᒪ承接、⦉并列、⦉选择、⦉递进、ᔭ转折）</span>
        <span>话题导引：＋承主、－续宾、±接句、⤷承导、⤹导语</span>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>


<style lang="scss" scoped>
.doc-card-title {
  margin-left: -24px;
  padding: 2px 10px 2px 24px;
  background: #e0e0e0;
  color: black;
  font-weight: bolder;
  position: relative;
  border-radius: 3px 5px 5px 0;
}

.doc-card-title:after {
  content: '';
  position: absolute;
  top: 100%;
  left: 0;
  width: 0;
  height: 0;
  border: 0 solid transparent;
  border-top-color: #bebebe;
  border-width: 9px 0 0 11px;
}
</style>