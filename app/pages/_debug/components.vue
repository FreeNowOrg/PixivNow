<template lang="pug">
#debug-components.body-inner
  h1 组件展示
  .toolbar
    span.toolbar__label 当前主题
    ThemeToggle
  p.hint 常用 Fnb 组件总览，跟随当前主题渲染。切换上方主题查看亮 / 暗效果。

  .preview-group
    h3 按钮 Button
    .row
      FnbButton 默认
      FnbButton(variant='primary') 主要
      FnbButton(variant='success') 成功
      FnbButton(variant='danger') 危险
      FnbButton(variant='primary' :loading='true') 加载中
      FnbButton(disabled) 禁用
      FnbButton(variant='primary' size='sm') 小号
      FnbButton(variant='primary' size='lg') 大号

  .preview-group
    h3 标签 Tag
    .row
      FnbTag 普通标签
      FnbTag(:active='true') 选中标签
      FnbTag(:clickable='true') 可点击
      FnbTag(color='var(--fnb-bookmark)') 收藏

  .preview-group
    h3 卡片 Card
    .row
      FnbCard 白色卡片
      FnbCard(color='brand') 品牌卡片
      FnbCard(color='highlight') 高亮卡片
      FnbCard(color='success') 成功卡片

  .preview-group
    h3 输入 Input / 下拉 Select
    .row
      FnbInput(v-model='inputVal' placeholder='请输入…')
      FnbSelect(:options='selectOptions' v-model='selectVal')

  .preview-group
    h3 标签页 Tabs
    FnbTabs(v-model='tabVal' :tabs='previewTabs')
      template(#panel-tab1) 面板一内容
      template(#panel-tab2) 面板二内容
      template(#panel-tab3) 面板三内容

  .preview-group
    h3 消息框 Mbox
    .stack
      FnbMbox(type='info' header='信息') 这是一条信息提示。
      FnbMbox(type='success' header='成功') 操作已成功完成。
      FnbMbox(type='warning' header='警告') 请注意此处的风险。
      FnbMbox(type='error' header='错误' :closable='true') 出现了一个错误。

  .preview-group
    h3 分页 Pagination
    FnbPagination(:page='pageVal' :item-count='200' :page-size='20' @update:page='pageVal = $event')

  .preview-group
    h3 进度 Progress / 加载 Spin
    .row.row--middle
      .progress-box
        FnbProgress(:percentage='65' :show-value='true')
      FnbSpin(:show='true' size='medium')

  .preview-group
    h3 结果 Result
    FnbResult(status='success' title='操作成功' description='你的请求已处理完成。')

  .preview-group
    h3 骨架屏 Skeleton
    .row
      FnbSkeleton
      FnbSkeleton
</template>

<script lang="ts" setup>
definePageMeta({ name: 'debug-components' })
import { setTitle } from '~/utils/setTitle'

const inputVal = ref('可编辑文本')
const selectVal = ref('a')
const selectOptions = [
  { label: '选项 A', value: 'a' },
  { label: '选项 B', value: 'b' },
  { label: '选项 C', value: 'c' },
]
const tabVal = ref('tab1')
const previewTabs = [
  { key: 'tab1', label: '标签一' },
  { key: 'tab2', label: '标签二' },
  { key: 'tab3', label: '标签三' },
]
const pageVal = ref(2)

onMounted(() => setTitle('Debug · Components'))
</script>

<style scoped lang="scss">
#debug-components {
  padding-bottom: 4rem;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;

  &__label {
    font-weight: 700;
  }
}

.hint {
  color: var(--fnb-text-muted);
  max-width: 60ch;
}

.preview-group {
  margin-top: 2rem;

  h3 {
    margin-bottom: 1rem;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;

  &--middle {
    align-items: center;
  }
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-width: 480px;
}

.progress-box {
  flex: 1;
  min-width: 240px;
}
</style>
