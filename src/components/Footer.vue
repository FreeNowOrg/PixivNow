<template lang="pug">
footer.globalFooter
  p
    | &copy; Copyright {{ yearStr }}
    |
    a(:href="GITHUB_URL" target="_blank").
      {{ PROJECT_NAME }}
    | 
    em v{{ version }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { GITHUB_URL, PROJECT_NAME } from '../config'
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
    }
  },
})
</script>
<style scoped lang="sass">
.globalFooter
  background-color: var(--theme-accent-color)
  padding: 0.4rem 1rem
  font-size: 1rem
  color: var(--theme-accent-link-color)
  position: absolute
  width: 100%
  box-sizing: border-box
  bottom: 0
  z-index: 10

  a
    --color: var(--theme-accent-link-color)
    font-weight: 600
</style>
