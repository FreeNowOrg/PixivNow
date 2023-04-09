export async function getElementUntilIntoView(
  selector?: HTMLElement | string,
  ratio = 0
): Promise<HTMLElement> {
  ratio = Math.max(0, Math.min(1, ratio))
  if (!selector) {
    return Promise.reject(new Error('Missing selector'))
  }
  const target =
    typeof selector === 'string'
      ? document.querySelector<HTMLElement>(selector)
      : selector
  if (!target) {
    return Promise.reject(new Error('Missing target node'))
  }
  return new Promise<HTMLElement>((resolve) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const { isIntersecting, intersectionRatio } = entry
        if (isIntersecting && intersectionRatio >= ratio) {
          observer.disconnect()
          resolve(target)
        }
      },
      { threshold: [0, 1, ratio] }
    )
    observer.observe(target)
  })
}
