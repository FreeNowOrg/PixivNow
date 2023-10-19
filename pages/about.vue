<template lang="pug">
mixin repoLink
  ExternalLink(href='https://github.com/FreeNowOrg/PixivNow' target='_blank') FreeNowOrg / PixivNow

#about-view.body-inner
  h1#top 关于我们
  section.intro
    Card(title='简介')
      p
        strong PixivNow
        |
        | 是一个 Pixiv 代理服务，旨在为某些无法直接访问 Pixiv 地区的 ACGN 爱好者提供一个欣赏 P 站插画的途径。

    Card(title='使用方法')
      h3 访客
      p 正常用，有手就行（
      h3 开发者
      p API 文档暂时懒得写……反正设置了 <code>access-control-allow-origin: *</code>，其他的自己慢慢试吧（

    Card(title='访问令牌')
      h3 这是什么
      p “访问令牌”指的是您在 Pixiv 源站登录账号后键名为<code>PHPSESSID</code>的 cookie。
      h3 隐私政策
      p 我们不会收集或转让您的个人信息或 cookie。
      h3 有什么用
      p 如果您选择提供您的访问令牌，就能使用一些高级功能。包括但不限于：
      ul
        li 能看到更感兴趣的相关推荐
        li 能够访问自己的收藏夹（暂时无法编辑）
        li 能够访问 NSFW 内容（设定为允许时）
        li 能够使用高级搜索（订阅过 Pixiv 会员时）
      p 部分高级功能的效果取决于您在 Pixiv 源站的设定，您可以在 <ExternalLink href="https://www.pixiv.net/setting_profile.php" target="_blank">这里</ExternalLink> 查看。

    Card(title='开销')
      p 我们的技术栈全都是白嫖来的，目前没有任何经济开销，因此您在使用的时候完全不用有心理负担（

    Card(title='鸣谢')
      p: em 以下排名不分先后
      h3 组织
      ul
        li <strong>GitHub</strong> 提供了源码托管和版本管控服务
        li <strong>Vercel</strong> 提供了页面托管和 serverless 计算服务
        li <strong>JS.ORG</strong> 提供了域名服务
      h3 个人
      p
        | 感谢为
        |
        +repoLink
        | &nbsp;
        | 贡献内容的全部编辑者！

    Card(title='免责声明')
      h3 色图相关
      p 我们本身不提供 NSFW 资源（例如 R-18 插画），任意访问此类资源的行为均是由用户在源站的参数设置中设定的。对于可能出现的 NSFW 资源我们均有做出明显的警告标记，我们不鼓励访问或传播此类资源。
      h3 用户言论
      p “用户言论”指的是 Pixiv 源站用户通过自我介绍、插画简介、评论区等功能发布的言论。这部分属于发表者自身的行为，我们无法有效控制。我们不会发布也不鼓励传播不当言论。如果您在浏览过程中发现了不当内容，我们非常鼓励您前往源站进行举报。
      h3 版权声明
      p 请求得到的全部数据以及媒体资源，版权归 Pixiv 或其原作者所有。
      p PixivNow 程序通过 Apache-2.0 协议授权。
      p 仅供交流与学习。

    Card(title='加入我们')
      p
        | 我们是开源项目，欢迎给我们点星星或者提交 PR 以及 issue：
        +repoLink
</template>

<script lang="ts" setup>
import Card from '@/components/Card.vue'
import ExternalLink from '@/components/ExternalLink.vue'

</script>
