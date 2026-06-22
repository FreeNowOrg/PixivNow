// ==UserScript==
// @name         PixivNow Login Helper
// @namespace    https://pixiv.js.org/
// @version      1.0.0
// @description  Add a "Login to PixivNow" button on Pixiv account portal
// @author       PixivNow
// @match        https://accounts.pixiv.net/*
// @grant        GM_cookie
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

;(function () {
  'use strict'

  const DEFAULT_HOST = 'https://pixiv.js.org'

  function getHost() {
    return GM_getValue('pixivnow_host', DEFAULT_HOST).replace(/\/$/, '')
  }

  GM_registerMenuCommand('设置 PixivNow URL', () => {
    const current = getHost()
    const input = prompt('PixivNow URL:', current)
    if (input !== null) {
      GM_setValue('pixivnow_host', input.trim() || DEFAULT_HOST)
      alert('已保存: ' + getHost())
    }
  })

  function createButton() {
    const btn = document.createElement('a')
    btn.textContent = '登录到 PixivNow'
    btn.href = '#'
    Object.assign(btn.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 24px',
      margin: '16px 0',
      fontSize: '14px',
      fontWeight: '700',
      color: '#fff',
      background: '#0096fa',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'background 0.2s',
    })
    btn.addEventListener('mouseenter', () => (btn.style.background = '#0082d9'))
    btn.addEventListener('mouseleave', () => (btn.style.background = '#0096fa'))
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      doLogin()
    })
    return btn
  }

  function doLogin() {
    GM_cookie.list({ domain: '.pixiv.net', name: 'PHPSESSID' }, (cookies) => {
      if (!cookies || cookies.length === 0) {
        alert(
          '无法获取 cookie。\n请前往 油猴(Tampermonkey) 管理面板，将`配置模式(Config Mode)`设置为`高级(Advanced)`，并将`安全(Security) > 允许脚本访问 Cookie (Allow scripts to access cookies)`更改为`全部(All)`以解决此问题。\n[安全警告] 这将允许所有用户脚本访问 cookie，可能导致安全问题。使用后请将其改回`除了 HttpOnly (Except HttpOnly)`。'
        )
        return
      }
      const token = cookies[0].value
      if (!token) {
        alert('未找到所需的 cookie，请重新登录 Pixiv 后再试。')
        return
      }
      const host = getHost()
      window.open(
        host + '/login?phpsessid=' + encodeURIComponent(token),
        '_blank'
      )
    })
  }

  function inject() {
    const path = window.location.pathname
    if (!path.startsWith('/portal')) {
      return
    }

    const container = document.querySelector(
      '[class*="portal"], [class*="Portal"], main, [role="main"]'
    )
    const target = container || document.body
    const wrapper = document.createElement('div')
    wrapper.style.textAlign = 'center'
    wrapper.appendChild(createButton())
    if (target.firstChild) {
      target.insertBefore(wrapper, target.firstChild)
    } else {
      target.appendChild(wrapper)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }
})()
