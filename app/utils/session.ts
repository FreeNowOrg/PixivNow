export function getExampleSessionId(): string {
  const uid = new Uint32Array(1)
  window.crypto.getRandomValues(uid)
  const secret = (() => {
    const strSet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const final = []
    const indexes = new Uint8Array(32)
    window.crypto.getRandomValues(indexes)
    for (const i of indexes) {
      const charIndex = Math.floor((i * strSet.length) / 256)
      final.push(strSet[charIndex])
    }
    return final.join('')
  })()
  return `${uid[0]}_${secret}`
}

export function isValidSessionId(sessionId: string) {
  return /^\d{2,10}_[0-9A-Za-z]{32}$/.test(sessionId)
}
