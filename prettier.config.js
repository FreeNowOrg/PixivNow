// @ts-check
/// <reference types="@prettier/plugin-pug/src/prettier" />
/**
 * @type {import("prettier").Config}
 */
export default {
  plugins: ['@prettier/plugin-pug'],

  arrowParens: 'always',
  quoteProps: 'as-needed',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',

  pugAttributeSeparator: 'as-needed',
  pugSortAttributes: 'asc',

  vueIndentScriptAndStyle: false,
}
