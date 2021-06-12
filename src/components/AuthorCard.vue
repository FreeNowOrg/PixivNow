<template>
  <div class="authorCard">
    <div class="left">
      <router-link :to="'/users/' + user.userId"
        ><img :src="API + user.imageBig" alt=""
      /></router-link>
    </div>
    <div class="right">
      <h4>
        <strong
          ><router-link :to="'/users/' + user.userId">{{
            user.name
          }}</router-link></strong
        >
      </h4>
      <p class="description">{{ user.comment }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  props: ['user'],
  data() {
    return {
      API: 'https://pixiv.wjghj.cn',
    }
  },
})
</script>

<style scoped lang="scss">
.authorCard {
  box-shadow: 0 0 4px #888;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  align-items: center;
}
.left {
  margin-right: 1rem;

  img {
    border-radius: 50%;
    width: 80px;
  }
}
</style>
