export type ThemeMode = 'auto' | 'light' | 'dark'

/**
 * Wraps useColorMode to expose a tri-state theme ('auto' | 'light' | 'dark').
 *
 * useColorMode defaults to selector='html' and attribute='class', so it toggles
 * the `dark` / `light` class on <html>, matching the `html.dark` CSS selectors.
 *
 * We use `colorMode.store` (not the deprecated `emitAuto` option) to read back
 * the raw stored value so that 'auto' is preserved for UI highlighting.
 */
export function useTheme() {
  const colorMode = useColorMode()

  // store holds the raw persisted value including 'auto', unlike the root ref
  // which resolves 'auto' to the system-preferred mode
  const mode = colorMode.store as Ref<ThemeMode>

  function setTheme(value: ThemeMode) {
    colorMode.value = value
  }

  return { mode, setTheme }
}
