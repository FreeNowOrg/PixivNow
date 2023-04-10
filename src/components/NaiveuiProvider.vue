<template lang="pug">
NConfigProvider(
  :locale='zhCN',
  :theme-overrides='theme'
  preflight-style-disabled
)
  NDialogProvider
    NMessageProvider
      slot
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  zhCN,
} from 'naive-ui'

const theme = ref({
  common: {
    primaryColor: 'rgb(53, 151, 231)',
    primaryColorHover: 'rgb(63, 161, 241)',
    primaryColorPressed: 'rgb(43, 141, 221)',
    infoColor: '#7a9dff',
    infoColorHover: '#b1c6ff',
    infoColorPressed: '#557ef1',
  },
})
</script>

<style scoped lang="sass"></style>
