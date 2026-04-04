const { PROJECT_NAME, PROJECT_TAGLINE } = useAppConfig()

export function setTitle(...args: (string | number | null | undefined)[]) {
  return (document.title = [
    ...args.filter((i) => i !== null && typeof i !== 'undefined'),
    `${PROJECT_NAME} - ${PROJECT_TAGLINE}`,
  ].join(' | '))
}
