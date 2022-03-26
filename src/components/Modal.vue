<template lang="pug">
.modal-container
  .modal-area(v-if='show')
    .modal-backdrop(@click='closeModal')
    .modal-window
      a.plain.close-btn(roll='button', @click='closeModal')
        fa(icon='times')
      section.modal-content
        div
          slot
</template>

<script lang="ts" setup>
import { onMounted, watch } from 'vue'

const props = defineProps<{
  show: boolean
}>()

watch(props, () => {
  if (props.show) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'visible'
  }
})

const emit = defineEmits<{
  (e: 'update:show', updateShow: boolean): void
}>()

function showModal() {
  emit('update:show', true)
}

function closeModal() {
  emit('update:show', false)
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
  })
})
</script>

<style scoped lang="sass">

.modal-area
  z-index: 120
  overflow: auto
  display: flex

.modal-area,
.modal-backdrop
  position: fixed
  top: 0px
  left: 0px
  width: 100vw
  height: 100vh

.modal-backdrop
  background-color: rgba(0, 0, 0, 0.32)
  z-index: -1

.modal-window
  -webkit-box-flex: 0
  -webkit-flex: none
  display: flex
  flex: none
  margin: auto
  padding: 2.5rem
  position: relative
  width: 640px
  max-width: 100%
  z-index: 1

.modal-content
  -moz-box-flex: 1
  flex-grow: 1
  border-radius: 1.5rem
  background: var(--theme-background-color)
  padding: 2rem
  overflow: hidden
  word-break: break-all

.close-btn
  position: absolute
  right: 3.5rem
  top: 3.5rem
  font-size: 1.5rem
  color: #aaa
  cursor: pointer
  z-index: 10
</style>
