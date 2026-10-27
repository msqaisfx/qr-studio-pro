import type { ChildProcess } from 'node:child_process'

export function closeWebSocket(socket: WebSocket | undefined, timeoutMs?: number): Promise<boolean>
export function stopChildProcess(child: ChildProcess | undefined, timeoutMs?: number): Promise<boolean>
export function createDeadline(timeoutMs: number, onTimeout: () => void): () => void
