<template lang="pug">
#debug-theme.body-inner
  h1 主题调试 · 暗色硬阴影
  .toolbar
    span.toolbar__label 当前主题
    ThemeToggle

  p.hint 暗色边框 / 阴影方案并排对比。每个面板自带背景、卡片、边框、阴影，互不影响，可慢慢看。点「应用到整页」会把该方案套到下方真实组件上。

  .scheme-grid
    .scheme(v-for='s in schemes' :key='s.label' :style='{ background: s.bg }')
      .scheme__card(:style='cardStyle(s)')
        .scheme__card-title 作品卡片标题
        .scheme__card-meta @artist · 12.3K 浏览
        button.scheme__btn(:style='btnStyle(s)') 收藏
      .scheme__label
        strong {{ s.label }}
        span.scheme__hex bg {{ s.bg }}
        span.scheme__hex surface {{ s.surface }}
        span.scheme__hex border {{ s.border }}
        span.scheme__hex shadow {{ s.shadow }}
      button.scheme__apply(@click='applyLive(s)') 应用到整页

  .live-note(v-if='applied')
    | 已把「{{ applied.label }}」实时应用到本页。
    button.scheme__apply(@click='resetLive') 还原

  h2.plain.preview-title 组件预览
  p.hint 以下组件跟随当前主题渲染；点上方某档「应用到整页预览」后，这里也会按该边框 / 阴影方案实时变化。

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
definePageMeta({ name: 'debug-theme' })
import { setTitle } from '~/utils/setTitle'

interface Scheme {
  label: string
  bg: string
  surface: string
  border: string
  shadow: string
}

// Dark-mode border/shadow scheme candidates. Edit freely — this is a playground.
const schemes: Scheme[] = [
  { label: 'A 中性白边', bg: '#2d2c31', surface: '#1f1e28', border: '#f3f3f6', shadow: '#f3f3f6' },
  { label: 'B 品牌蓝调白边', bg: '#161b26', surface: '#1d2433', border: '#f3f3f6', shadow: '#f3f3f6' },
  { label: 'C 灰双色', bg: '#14151b', surface: '#1e222b', border: '#70747f', shadow: '#3a3d47' },
  { label: 'D 蓝硬阴影', bg: '#14151b', surface: '#1e222b', border: '#3a3d47', shadow: '#2f5ea8' },
]

function cardStyle(s: Scheme) {
  return {
    background: s.surface,
    border: `3px solid ${s.border}`,
    boxShadow: `6px 6px 0 0 ${s.shadow}`,
    color: '#eef0f3',
  }
}

function btnStyle(s: Scheme) {
  return {
    background: '#4993ff',
    color: '#fff',
    border: `2px solid ${s.border}`,
    boxShadow: `3px 3px 0 0 ${s.shadow}`,
  }
}

const applied = ref<Scheme | null>(null)
const shadowVars = [
  ['--fnb-shadow', '6px 6px 0 0'],
  ['--fnb-shadow-sm', '4px 4px 0 0'],
  ['--fnb-shadow-lg', '8px 8px 0 0'],
  ['--fnb-shadow-xs', '3px 3px 0 0'],
] as const

function applyLive(s: Scheme) {
  const el = document.documentElement
  el.style.setProperty('--fnb-bg', s.bg)
  el.style.setProperty('--fnb-surface', s.surface)
  el.style.setProperty('--fnb-border', s.border)
  shadowVars.forEach(([name, offset]) =>
    el.style.setProperty(name, `${offset} ${s.shadow}`)
  )
  applied.value = s
}

function resetLive() {
  const el = document.documentElement
  ;['--fnb-bg', '--fnb-surface', '--fnb-border', ...shadowVars.map(([n]) => n)].forEach(
    (n) => el.style.removeProperty(n)
  )
  applied.value = null
}

// Component preview state
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

onBeforeUnmount(resetLive)
onMounted(() => setTitle('Debug · Theme'))
</script>

<style scoped lang="scss">
#debug-theme {
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

.scheme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.scheme {
  padding: 2rem 2rem 1.5rem;
  border: 2px solid var(--fnb-divider);
}

.scheme__card {
  padding: 1.1rem;

  &-title {
    font-weight: 700;
    margin-bottom: 0.4rem;
  }

  &-meta {
    color: #9aa1ac;
    font-size: 0.8rem;
    margin-bottom: 0.9rem;
  }
}

.scheme__btn {
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.3rem 0.9rem;
  cursor: pointer;
  border-radius: 0;
}

.scheme__label {
  display: flex;
  flex-direction: column;
  margin-top: 1.4rem;
  color: #eef0f3;

  strong {
    margin-bottom: 0.3rem;
  }
}

.scheme__hex {
  color: #9aa1ac;
  font-size: 0.72rem;
  font-family: var(--fnb-font-mono);
}

.scheme__apply {
  margin-top: 0.8rem;
  align-self: flex-start;
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.25rem 0.7rem;
  background: transparent;
  color: #eef0f3;
  border: 2px solid #f3f3f6;
  cursor: pointer;
}

.live-note {
  margin-top: 2rem;
  padding: 0.8rem 1rem;
  border: 2px solid var(--fnb-divider);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.preview-title {
  margin-top: 3.5rem;
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
