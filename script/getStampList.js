/**
 * @desc 获取绘文字的映射表
 *       这个是扔到浏览器控制台里用的
 *       点开评论框旁边的笑脸然后运行
 * @example (normal) => https://pixiv.js.org/~/common/images/emoji/101.png
 */
!(() => {
  const btn = document.querySelectorAll('.emoji-mart-category-list button')
  const list = {}
  for (let i of btn) {
    const label = i.attributes['aria-label'].value.replace(/[\(\)]/g, '')
    const url = i
      .querySelector('span')
      .style.backgroundImage.replace(
        /url\("https:\/\/s\.pximg\.net(.+)"\)/g,
        '/~$1'
      )
    list[label] = url
  }
  console.log(list)
})()

// 表情贴图的地址
// `/common/images/stamp/generated-stamps/${stampId}_s.jpg`
