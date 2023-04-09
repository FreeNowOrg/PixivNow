import { createI18n, I18n } from 'vue-i18n'

export const SUPPORTED_LOCALES = ['zh-Hans']

export function setupI18n(options = { locale: 'zh-Hans' }) {
  const i18n = createI18n({ ...options, legacy: false })
  setI18nLanguage(i18n, options.locale)
  return i18n
}

export function setI18nLanguage(
  i18n: I18n<any, any, any, string, false>,
  locale: string
) {
  i18n.global.locale.value = locale
  document.querySelector('html')?.setAttribute('lang', locale)
}

export async function loadLocaleMessages(
  i18n: I18n<any, any, any, string, false>,
  locale: string
) {
  const messages = await import(
    /* webpackChunkName: "locale-[request]" */ `@/locales/${locale}.json`
  )
  i18n.global.setLocaleMessage(locale, messages.default)
  setI18nLanguage(i18n, locale)

  return nextTick()
}
