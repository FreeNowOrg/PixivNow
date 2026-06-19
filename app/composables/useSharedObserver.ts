const callbacks = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | null = null

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target)
            if (cb) {
              cb()
              observer!.unobserve(entry.target)
              callbacks.delete(entry.target)
            }
          }
        }
      },
      { rootMargin: '200px' }
    )
  }
  return observer
}

export function observeLazy(el: Element, cb: () => void) {
  callbacks.set(el, cb)
  getObserver().observe(el)
}

export function unobserveLazy(el: Element) {
  callbacks.delete(el)
  getObserver().unobserve(el)
}
