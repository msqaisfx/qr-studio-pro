const waitForEvent = (target, event, timeoutMs) => new Promise((resolve) => {
  let timer
  const finish = (value) => {
    clearTimeout(timer)
    target.removeListener?.(event, onEvent)
    target.removeEventListener?.(event, onEvent)
    resolve(value)
  }
  const onEvent = (...args) => finish(args)
  target.once?.(event, onEvent)
  target.addEventListener?.(event, onEvent, { once: true })
  timer = setTimeout(() => finish(null), timeoutMs)
  timer.unref?.()
})

export const closeWebSocket = async (socket, timeoutMs = 2_000) => {
  if (!socket || socket.readyState === 3) return true
  const closed = waitForEvent(socket, 'close', timeoutMs)
  if (socket.readyState === 1) socket.close()
  return Boolean(await closed)
}

export const stopChildProcess = async (child, timeoutMs = 5_000) => {
  if (!child || child.exitCode !== null || child.signalCode !== null) return true
  let exited = waitForEvent(child, 'exit', timeoutMs)
  child.kill('SIGTERM')
  if (await exited) return true

  exited = waitForEvent(child, 'exit', timeoutMs)
  child.kill('SIGKILL')
  return Boolean(await exited)
}

export const createDeadline = (timeoutMs, onTimeout) => {
  const timer = setTimeout(onTimeout, timeoutMs)
  timer.unref?.()
  return () => clearTimeout(timer)
}
