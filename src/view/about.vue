<template lang="pug">
mixin repoLink
  a(:href="GITHUB_URL" target="_blank") {{ GITHUB_OWNER }}/{{ GITHUB_REPO }}

h1 关于我们
section.intro
  card(title="简介")
    p
      strong {{ PROJECT_NAME }}
      |  是一个 Pixiv 代理服务，旨在为某些无法直接访问 Pixiv 地区的 ACGN 爱好者提供一个欣赏 P 站插画的途径。

  card(title="使用方法")
    h3 访客
    p 正常用，有手就行（
    h3 开发者
    p API 文档暂时懒得写……反正设置了 <code>access-control-allow-origin: *</code>，其他的自己慢慢试吧（

  card(title="访问令牌")
    h3 这是什么
    p “访问令牌”指的是您在 Pixiv 源站登录账号后键名为<code>PHPSESSID</code>的 cookie。
    h3 隐私政策
    p 我们不会收集或转让您的个人信息或 cookie。
    h3 有什么用
    p 如果您选择提供您的访问令牌，就能使用排行榜、相关推荐等高级功能，包括访问 NSFW 内容以及高级搜索等，这部分取决于您在 Pixiv 源站的设定。

  card(title="开销")
    p
      | 我们的技术栈全都是白嫖来的，目前没有任何经济开销，因此您在使用的时候完全不用有心理负担（

  card(title="鸣谢")
    p: em 以下排名不分先后
    h3 组织
    ul
      li <strong>GitHub</strong> 提供了源码托管和版本管控服务
      li <strong>Vercel</strong> 提供了页面托管和 serverless 计算服务
      li <strong>JS.ORG</strong> 提供了域名服务
    h3 个人
    p 
      | 感谢为 
      +repoLink()
      |  贡献内容的全部编辑者！

  card(title="免责声明")
    h3 版权声明
    p 请求得到的全部数据以及媒体资源，版权归 Pixiv 或其原作者所有。
    p PixivNow 程序通过 Apache-2.0 协议授权。
    p 仅供交流与学习。
    h3 色图相关
    p 我们本身不提供 NSFW 资源（例如R-18 插画），任意访问此类资源的行为均是由用户在源站的参数设置中设定的。对于可能出现的 NSFW 资源我们均有做出明显的警告标记，我们不鼓励访问或传播此类资源。

  card(title="加入我们")
    p
      | 我们是开源项目，欢迎给我们点星星或者提交 PR 以及 issue：
      +repoLink
</template>

<script lang="ts">
import Card from '../components/Card.vue'
import { PROJECT_NAME, GITHUB_OWNER, GITHUB_REPO, GITHUB_URL } from '../config'

export default {
  components: { Card },
  data() {
    return {
      PROJECT_NAME,
      GITHUB_OWNER,
      GITHUB_REPO,
      GITHUB_URL,
    }
  },
  mounted() {
    document.title = 'About | PixivNow'
  },
}
</script>

<style scoped></style>
