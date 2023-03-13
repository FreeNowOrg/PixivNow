module.exports = {
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  arrowParens: 'always',
  quoteProps: 'as-needed',
  plugins: [require.resolve('@prettier/plugin-pug')],
  pugAttributeSeparator: 'as-needed',
  pugSortAttributes: 'asc',
  vueIndentScriptAndStyle: false,
}
