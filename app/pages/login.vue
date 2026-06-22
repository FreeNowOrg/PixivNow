<template lang="pug">
#auth-view
  form#login-form.not-logged-in(v-if='!userStore.isLoggedIn')
    RouterLink.button(
      :to='$route.query.back?.toString()'
      v-if='$route.query.back'
    )
      IFasAngleLeft
      | &nbsp;取消
    h1.title 设置 Pixiv 令牌
    .fnb-form-item
      label.fnb-form-item__label PHPSESSID
        span.fnb-form-item__required *
      FnbInput(
        :class='validateSessionId(sessionIdInput) ? "valid" : "invalid"'
        v-model='sessionIdInput'
      )
      .fnb-form-item__feedback(
        :class='(sessionIdInput && !validateSessionId(sessionIdInput)) || error ? "fnb-form-item__feedback--error" : "fnb-form-item__feedback--success"'
      ) {{ !sessionIdInput ? '请输入令牌' : !validateSessionId(sessionIdInput) ? '哎呀，这个格式看上去不太对……' : error ? error : '这个格式看上去没问题，点击保存试试' }}
    #submit
      FnbButton(
        :disabled='!!error || loading || !validateSessionId(sessionIdInput)',
        :loading='loading'
        @click='async () => await submit()'
        style='width: 100%'
        variant='primary'
      ) {{ loading ? '登录中……' : '保存令牌' }}
    .tips
      h2 如何获取 Pixiv 令牌？
      ol.guide-steps
        li 访问 #[ExternalLink(href='https://accounts.pixiv.net/portal' rel='noopener noreferrer' target='_blank') Pixiv 账户中心] 并登录您的账号
        li 按 #[kbd F12] 打开浏览器开发者工具
        li 切换到「应用」(Application) 选项卡（部分浏览器中显示为「存储」Storage），展开左侧「Cookie」列表
        li 找到 #[code PHPSESSID] 一行，双击复制它的值，粘贴到上方输入框
      .guide-image
        FnbImage(
          alt='获取 PHPSESSID 指引图'
          previewSrc='https://files.seeusercontent.com/2026/06/22/bkL1/PixPin_2026-06-22_12-51-31.png'
          src='https://files.seeusercontent.com/2026/06/22/bkL1/PixPin_2026-06-22_12-51-31.png'
        )
        .guide-image__hint 点击查看大图

      h2 安全吗？
      p PixivNow 本身不会存储您的凭据，但第三方部署的实例不在我们的控制范围内。请仅在您信任的实例上使用此功能。
      p 详细说明见：#[NuxtLink(to='/about#account-security') 安全说明]。

  #login-form.logged-in(v-if='userStore.isLoggedIn')
    RouterLink.button(
      :to='$route.query.back?.toString()'
      v-if='$route.query.back'
    )
      IFasAngleLeft
      | &nbsp;返回
    h1 查看 Pixiv 令牌
    FnbInput.token(:model-value='currentToken' readonly)
    #submit
      FnbButton(@click='remove' variant='danger') 移除令牌
</template>

<script lang="ts" setup>
definePageMeta({ name: 'login' })
import {
  validateSessionId,
  login,
  logout,
  getToken,
} from '~/composables/userData'
import { useUserStore } from '~/stores/session'
import IFasAngleLeft from '~icons/fa-solid/angle-left'

const currentToken = computed(() => getToken() || '')
const sessionIdInput = ref('')
const error = ref('')
const loading = ref(false)
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

onMounted(async () => {
  const token = route.query.phpsessid as string | undefined
  if (!token) return
  const { phpsessid: _, ...restQuery } = route.query
  router.replace({ path: '/login', query: restQuery })
  if (!validateSessionId(token)) {
    error.value = '令牌格式无效'
    return
  }
  try {
    loading.value = true
    const userData = await login(token)
    userStore.login(userData)
    goBack()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
})

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

<style scoped lang="scss">
#login-form {
  width: 400px;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box;
  @include fnb-card;
  transition: box-shadow 0.24s ease-in-out;
}

@media screen and (max-width: 500px) {
  #login-form {
    width: 100%;
  }
}

input {
  width: 100%;
  display: block;
  padding: 4px 8px;
  font-size: 1.2rem;
}

#submit {
  text-align: center;
  margin: 1rem auto;

  .btn {
    width: 50%;
  }
}

code {
  user-select: none;
}

kbd {
  display: inline-block;
  padding: 0.1em 0.4em;
  font-size: 0.85em;
  font-family: inherit;
  background: var(--fnb-bg-alt, #f0f0f0);
  border: 1px solid var(--fnb-border);
  border-radius: 3px;
  box-shadow: 0 1px 0 var(--fnb-border);
}

.fnb-form-item {
  margin-bottom: 1rem;

  &__label {
    display: block;
    font-weight: 700;
    margin-bottom: 0.4rem;
  }

  &__required {
    color: var(--fnb-danger);
    margin-left: 0.25rem;
  }

  &__feedback {
    margin-top: 0.3rem;
    font-size: 0.85rem;

    &--error {
      color: var(--fnb-danger);
    }

    &--success {
      color: var(--fnb-success, green);
    }
  }
}

.guide-steps {
  padding-left: 1.5rem;
  margin: 0.5rem 0 1rem;

  li {
    margin: 0.4rem 0;
    line-height: 1.6;
  }
}

.guide-image {
  margin: 1rem 0;

  img {
    width: 100%;
    display: block;
  }

  &__hint {
    text-align: center;
    padding: 0.2rem;
    font-size: 0.8rem;
    color: var(--fnb-text-muted);
  }
}
</style>
