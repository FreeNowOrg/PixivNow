export function replaceUrl(s: string) {
  return s
    .replaceAll(/https:(?:\\)?\/(?:\\)?\/i\.pximg\.net(?:\\)?\//g, '/-/')
    .replaceAll(/https:(?:\\)?\/(?:\\)?\/s\.pximg\.net(?:\\)?\//g, '/~/')
}
