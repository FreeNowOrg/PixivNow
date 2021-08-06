<template lang="pug">
footer.globalFooter
  .top.flex.container
    section.flex-1
      h4 探索更多
      ul
        li aaa
        li aaa
        li aaa
        li aaa
    section.flex-1
      h4 关注我们
      ul
        li
          a(:href="`https://github.com/${GITHUB_OWNER}`") Free Now Tech.
        li
          router-link(to="/users/32338232") 站长的 Pixiv
    section.flex-1
      h4 概览
      ul
        li ccc
        li ccc
        li ccc
    section.flex-1
      h4 友情链接
      ul
        li ddd
        li ddd
        li ddd
        li ddd
        li ddd
        li ddd

  .bottom.align-center
    p.copyright
      | &copy; Copyright {{ yearStr }}
      |
      a(:href="GITHUB_URL" target="_blank").
        {{ PROJECT_NAME }}
      | 
      em v{{ version }}
    .devOnly(style="font-style: italic")
      | This is test site →&nbsp;
      a(
        :href="'https://pixiv.js.org' + $route.path"
        target="_blank"
      ) Go to Prod.
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { GITHUB_URL, PROJECT_NAME, GITHUB_OWNER } from '../config'
import { version } from '../../package.json'

export default defineComponent({
  name: 'comp-footer',
  setup() {
    const year = new Date().getFullYear()
    return {
      version,
      yearStr: 2021 === year ? year : `(2021 - ${year})`,
      GITHUB_URL,
      PROJECT_NAME,
      GITHUB_OWNER,
    }
  },
})
</script>
<style scoped lang="sass">
.globalFooter
  background-color: var(--theme-accent-color)
  font-size: 1rem
  color: var(--theme-accent-link-color)

  > div
    padding-top: 0.5rem
    padding-bottom: 0.5rem

a
  --color: var(--theme-accent-link-color)
  font-weight: 600

  &::after
    visibility: visible
    transform: scaleX(1)
    width: 40%
    height: 1px

  &:hover::after
    width: 100%

.bottom
  background-color: var(--theme-accent-color-darken)

h4
  display: inline-block
  position: relative
  margin: 1rem 0 0.5rem 0

  &::after
    content: ''
    display: block
    position: absolute
    width: 100%
    height: 2px
    bottom: -2px
    left: 0
    background-color: var(--theme-accent-link-color)

ul
  padding-left: 1rem
  margin: 0.2rem 0

  a
    border-bottom: 1px solid
    display: inline

@media screen and (max-width: 600px)
  .top
    flex-direction: column
</style>
