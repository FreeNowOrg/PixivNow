<template lang="pug">
Card.authorCard(title='')
  .flex-center
    .left
      router-link(:to="'/users/' + user.userId")
        img(:src="API + user.imageBig" alt="")
    .right
      .flex
        h4
          router-link(:to="'/users/' + user.userId") {{ user.name }}
        button
          | 关注&nbsp;
          fa(icon="plus")
      p.description.pre {{ user.comment }}

  ArtworksMiniList.inline.tiny(:list="user.illusts")
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import ArtworksMiniList from '../components/ArtworksList/ArtworksMiniList.vue'
import Card from './Card.vue'

const props = defineProps<{
  user: {
    userId: string
    imageBig: string
    name: string
    comment: string
    illusts: {
      id: number
      title: string
      userName: string
      userId: string
      profileImageUrl: string
      profileImg: string
      xRestrict: boolean
      pageCount: number
      isAdContainer: boolean
      url: string
      bookmarkData: any
      alt: string
    }[]
  }
}>()
const API = ref('https://pixiv.js.org')
</script>

<style scoped lang="sass">
.left
  margin-right: 1rem

  img
    border-radius: 50%
    width: 80px
    height: 80px

.right
  flex: 1

  h4
    margin: 0.2rem 0
    flex: 1
    font-weight: 600

  button
    background-color: #efefef
    color: var(--theme-text-color)
    padding: 0.2rem 1rem
    border-radius: 1rem
    
.description
  width: 100%
  max-height: 80px
  overflow: auto
</style>
