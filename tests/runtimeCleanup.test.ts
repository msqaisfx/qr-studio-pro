import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { closeWebSocket, createDeadline, stopChildProcess } from '../scripts/lib/runtime-cleanup.mjs'

class FakeSocket extends EventTarget {
  CLOSED = 3
  readyState = 1
  close() {
    this.readyState = this.CLOSED
    this.dispatchEvent(new Event('close'))
  }
}

class FakeChild extends EventEmitter {
  exitCode: number | null = null
  signalCode: string | null = null
  signals: string[] = []
  kill(signal: string) {
    this.signals.push(signal)
    this.signalCode = signal
    queueMicrotask(() => this.emit('exit', null, signal))
    return true
  }
}

class StubbornChild extends FakeChild {
  override kill(signal: string) {
    this.signals.push(signal)
    if (signal === 'SIGKILL') {
      this.signalCode = signal
      queueMicrotask(() => this.emit('exit', null, signal))
    }
    return true
  }
}

describe('public verification runtime cleanup', () => {
  it('waits for the CDP WebSocket to close', async () => {
    await expect(closeWebSocket(new FakeSocket() as never, 50)).resolves.toBe(true)
  })

  it('terminates and waits for the Chrome child process', async () => {
    const child = new FakeChild()
    await expect(stopChildProcess(child as never, 50)).resolves.toBe(true)
    expect(child.signals).toEqual(['SIGTERM'])
  })

  it('escalates to SIGKILL when Chrome ignores SIGTERM', async () => {
    const child = new StubbornChild()
    await expect(stopChildProcess(child as never, 5)).resolves.toBe(true)
    expect(child.signals).toEqual(['SIGTERM', 'SIGKILL'])
  })

  it('clears the watchdog after a successful run', () => {
    vi.useFakeTimers()
    const onTimeout = vi.fn()
    const cancel = createDeadline(100, onTimeout)
    cancel()
    vi.advanceTimersByTime(101)
    expect(onTimeout).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})
