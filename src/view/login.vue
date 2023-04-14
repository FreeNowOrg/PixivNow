<template lang="pug">
NForm#login-form.not-logged-in(v-if='!userStore.isLoggedIn')
  RouterLink.button(
    :to='$route.query.back.toString()'
    v-if='$route.query.back'
  )
    IFasAngleLeft
    | &nbsp;取消
  h1.title 设置 Pixiv 令牌
  NFormItem(
    :feedback='sessionIdInput && !validateSessionId(sessionIdInput) ? "哎呀，这个格式看上去不太对……" : error ? error : "这个格式看上去没问题，点击保存试试"',
    :validation-status='(sessionIdInput && !validateSessionId(sessionIdInput)) || error ? "error" : "success"'
    label='PHPSESSID'
    required
  )
    NInput(
      :class='validateSessionId(sessionIdInput) ? "valid" : "invalid"'
      v-model:value='sessionIdInput'
    )
  #submit
    NButton(
      :disabled='!!error || loading || !validateSessionId(sessionIdInput)'
      @click='async () => await submit()'
      block
      type='primary'
    ) {{ loading ? '登录中……' : '保存令牌' }}
  .tips
    h2 如何获取 Pixiv 令牌？
    p 访问 <a href="https://www.pixiv.net" target="_blank">www.pixiv.net</a> 源站并登录，打开浏览器控制台(f12)，点击“存储(storage)”一栏，在 cookie 列表里找到“键(key)”为<code>PHPSESSID</code>的一栏，将它的“值(value)”复制后填写到这里。
    p
      | 它应该形如：
      code(@click='exampleSessionId' title='此处的令牌为随机生成，仅供演示使用') {{ example }}
      | 。
    h2 PixivNow 会窃取我的个人信息吗？
    p 我们<strong>不会</strong>存储或转让您的个人信息以及 cookie。
    p 不过我们建议妥善保存您的 cookie。您在此处保存的信息若被他人获取有被盗号的风险。

#login-form.logged-in(v-if='userStore.isLoggedIn')
  RouterLink.button(
    :to='$route.query.back.toString()'
    v-if='$route.query.back'
  )
    IFasAngleLeft
    | &nbsp;返回
  h1 查看 Pixiv 令牌
  NInput.token(:value='Cookies.get("PHPSESSID")' readonly)
  #submit
    NButton(@click='remove' type='error') 移除令牌
</template>

<script lang="ts" setup>
import Cookies from 'js-cookie'
import {
  exampleSessionId,
  validateSessionId,
  login,
  logout,
} from '@/components/userData'
import { useUserStore } from '@/composables/states'
import IFasAngleLeft from '~icons/fa-solid/angle-left'
import { NButton, NForm, NFormItem, NInput } from 'naive-ui'

const example = ref(exampleSessionId())
const sessionIdInput = ref('')
const error = ref('')
const loading = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

function goBack(): void {
  const back = route.query.back
  if (back) {
    router.push(back as string)
  } else {
    router.push('/')
  }
}

async function submit(): Promise<void> {
  if (!validateSessionId(sessionIdInput.value)) {
    error.value = '哎呀，这个格式看上去不太对……'
    console.warn(error.value)
    return
  }
  try {
    loading.value = true
    const userData = await login(sessionIdInput.value)
    userStore.login(userData)
    error.value = ''
    goBack()
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = '哎呀，出错了，请重试！'
    }
  } finally {
    loading.value = false
  }
}

function remove(): void {
  logout()
  userStore.logout()
  goBack()
}

watch(sessionIdInput, () => (error.value = ''))
</script>

<style scoped lang="sass">

#login-form
  width: 400px
  margin: 0 auto
  padding: 1rem
  box-sizing: border-box
  box-shadow: var(--theme-box-shadow)
  border-radius: 4px
  padding: 1rem
  transition: box-shadow .24s ease-in-out

  &:hover
    box-shadow: var(--theme-box-shadow-hover)

@media screen and (max-width: 500px)
  #login-form
    width: 100%

input
  width: 100%
  display: block
  padding: 4px 8px
  font-size: 1.2rem

#submit
  text-align: center
  margin: 1rem auto

  .btn
    width: 50%

code
  user-select: none

.status
  margin-top: 0.2rem
  text-align: center
  padding: 4px
  color: #fff

  &.valid
    background-color: green

  &.invalid
    background-color: #a00
</style>
